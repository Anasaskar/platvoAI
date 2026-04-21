import { checkGenerationLimit } from "@/app/actions/action";
import { getAuthUser } from "@/lib/hono/hono-middlware";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import {
  cancelSubscription,
  getOrCreateStripeCustomer,
  reactivateSubscription,
  syncSubscriptionFromStripe,
} from "@/lib/stripe/subscription-manager";
import { getUsageStats } from "@/lib/credits/usage-calculator";
import { stripeClient } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { PLAN_ENUM } from "@/lib/constant";
import {
  getCurrentPaidSubscription,
  getCurrentSubscription,
} from "@/lib/subscription/current-subscription";
import Stripe from "stripe";

const DEFAULT_NO_PAID_SUBSCRIPTION_MESSAGE =
  "You don't have an active paid subscription. Please upgrade to continue.";
const PRODUCTION_APP_URL = "https://www.platvo.com/home";

const SUBSCRIPTION_STATUS_PRIORITY: Record<string, number> = {
  active: 3,
  trialing: 2,
  past_due: 1,
};

function getStripeAwareErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "type" in error &&
    (error as { type?: string }).type === "StripeConnectionError"
  ) {
    return "Temporary connection issue with Stripe. Please retry in a few seconds.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function isBindOnlyHostname(hostname: string) {
  return ["0.0.0.0", "0.0.0", "::", "[::]"].includes(hostname);
}

function normalizeLocalCallbackOrigin(origin: string) {
  const parsed = new URL(origin);

  if (isBindOnlyHostname(parsed.hostname)) {
    parsed.hostname = "localhost";

    if (parsed.protocol === "https:") {
      parsed.protocol = "http:";
    }
  }

  return parsed.origin;
}

function getPreferredCallbackOrigin(requestUrl: string) {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;

  if (configuredUrl) {
    try {
      return normalizeLocalCallbackOrigin(new URL(configuredUrl).origin);
    } catch {
      // Fall back to the request origin below.
    }
  }

  const request = new URL(requestUrl);

  if (
    process.env.NODE_ENV === "production" &&
    isBindOnlyHostname(request.hostname)
  ) {
    return new URL(PRODUCTION_APP_URL).origin;
  }

  return normalizeLocalCallbackOrigin(request.origin);
}

function getSafeCallbackUrl(rawUrl: string | undefined, requestUrl: string): string {
  const origin = getPreferredCallbackOrigin(requestUrl);

  if (!rawUrl) {
    return `${origin}/billing`;
  }

  try {
    const parsed = new URL(rawUrl, origin);
    const normalizedRawOrigin = normalizeLocalCallbackOrigin(parsed.origin);
    const isTrustedOrigin =
      normalizedRawOrigin === origin || isBindOnlyHostname(parsed.hostname);

    if (!isTrustedOrigin) {
      return `${origin}/billing`;
    }

    return `${origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return `${origin}/billing`;
  }
}

function pickSyncableSubscription(
  subscriptions: Stripe.Subscription[]
): Stripe.Subscription | undefined {
  return subscriptions
    .filter((sub) => sub.status in SUBSCRIPTION_STATUS_PRIORITY)
    .sort((a, b) => {
      const statusDelta =
        (SUBSCRIPTION_STATUS_PRIORITY[b.status] ?? 0) -
        (SUBSCRIPTION_STATUS_PRIORITY[a.status] ?? 0);

      if (statusDelta !== 0) {
        return statusDelta;
      }

      return (b.created ?? 0) - (a.created ?? 0);
    })[0];
}

export const subscriptionRoute = new Hono()
  .post("/upgrade", getAuthUser, async (c) => {
    try {
      if (!stripeClient) {
        throw new HTTPException(503, {
          message:
            "Stripe is not configured. Please set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.",
        });
      }

      const user = c.get("user");
      const body = await c.req.json();
      const { callbackUrl, plan } = body as {
        callbackUrl?: string;
        plan?: string;
      };

      if (!callbackUrl) {
        throw new HTTPException(400, {
          message: "callbackUrl is required",
        });
      }

      if (plan && plan !== PLAN_ENUM.ALL_IN_ONE) {
        throw new HTTPException(400, {
          message: "Only the PRO plan is currently supported.",
        });
      }

      // Get or create Stripe customer
      const customerId = await getOrCreateStripeCustomer(
        user.id,
        user.email,
        user.name
      );

      const safeCallbackUrl = getSafeCallbackUrl(callbackUrl, c.req.url);

      // Create checkout session
      const session = await createCheckoutSession(
        customerId,
        user.id,
        `${safeCallbackUrl}?success=true`,
        `${safeCallbackUrl}?canceled=true`
      );

      return c.json({
        success: true,
        url: session.url,
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error("Subscription upgrade error:", error);
      throw new HTTPException(500, {
        message: getStripeAwareErrorMessage(
          error,
          "Failed to create checkout session"
        ),
      });
    }
  })
  .post("/portal", getAuthUser, async (c) => {
    try {
      if (!stripeClient) {
        throw new HTTPException(500, {
          message: "Stripe service is temporarily unavailable. Please try again later.",
        });
      }

      const user = c.get("user");
      const body = await c.req.json().catch(() => ({}));
      const callbackUrl = getSafeCallbackUrl(
        (body as { callbackUrl?: string }).callbackUrl,
        c.req.url
      );

      const activePaidSubscription = await getCurrentPaidSubscription(user.id);
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { stripeCustomerId: true },
      });
      const stripeCustomerId =
        activePaidSubscription?.stripeCustomerId || dbUser?.stripeCustomerId;

      if (!stripeCustomerId) {
        throw new HTTPException(404, {
          message: DEFAULT_NO_PAID_SUBSCRIPTION_MESSAGE,
        });
      }

      const portalSession = await stripeClient.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: callbackUrl,
      });

      return c.json({
        success: true,
        url: portalSession.url,
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error("Create billing portal session error:", error);
      throw new HTTPException(500, {
        message:
          error instanceof Error
            ? error.message
            : "Failed to open billing portal",
      });
    }
  })
  .post("/cancel", getAuthUser, async (c) => {
    try {
      const user = c.get("user");
      const activePaidSubscription = await getCurrentPaidSubscription(user.id);

      if (!activePaidSubscription?.stripeSubscriptionId) {
        throw new HTTPException(404, {
          message: DEFAULT_NO_PAID_SUBSCRIPTION_MESSAGE,
        });
      }

      if (activePaidSubscription.cancelAtPeriodEnd) {
        return c.json({
          success: true,
          message: "Subscription is already set to cancel at period end.",
        });
      }

      await cancelSubscription(activePaidSubscription.stripeSubscriptionId);

      return c.json({
        success: true,
        message: "Subscription will cancel at the end of the current billing period.",
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error("Cancel subscription error:", error);
      throw new HTTPException(500, {
        message:
          error instanceof Error
            ? error.message
            : "Failed to cancel subscription",
      });
    }
  })
  .post("/reactivate", getAuthUser, async (c) => {
    try {
      const user = c.get("user");
      const activePaidSubscription = await getCurrentPaidSubscription(user.id);

      if (!activePaidSubscription?.stripeSubscriptionId) {
        throw new HTTPException(404, {
          message: DEFAULT_NO_PAID_SUBSCRIPTION_MESSAGE,
        });
      }

      await reactivateSubscription(activePaidSubscription.stripeSubscriptionId);

      return c.json({
        success: true,
        message: "Subscription reactivated successfully.",
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error("Reactivate subscription error:", error);
      throw new HTTPException(500, {
        message:
          error instanceof Error
            ? error.message
            : "Failed to reactivate subscription",
      });
    }
  })
  .get("/usage", getAuthUser, async (c) => {
    try {
      const user = c.get("user");
      const usageStats = await getUsageStats(user.id);
      return c.json({
        success: true,
        data: usageStats,
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      throw new HTTPException(500, {
        message: "Failed to retrieve usage data.",
      });
    }
  })
  .get("/status", getAuthUser, async (c) => {
    try {
      const user = c.get("user");
      const subscription = await getCurrentSubscription(user.id);

      return c.json({
        success: true,
        data: subscription
          ? {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            periodStart: subscription.periodStart,
            periodEnd: subscription.periodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            stripeSubscriptionId: subscription.stripeSubscriptionId,
            creditsUsed: subscription.creditsUsed,
            creditsLimit: subscription.creditsLimit,
            imagesUsed: subscription.imagesUsed,
            imagesLimit: subscription.imagesLimit,
          }
          : null,
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      throw new HTTPException(500, {
        message: "Failed to retrieve subscription status.",
      });
    }
  })
  .post("/sync", getAuthUser, async (c) => {
    // Manual sync endpoint - syncs subscription from Stripe
    try {
      const user = c.get("user");

      if (!stripeClient) {
        return c.json(
          {
            success: false,
            message: "Stripe service is temporarily unavailable. Please try again later.",
          },
          500
        );
      }

      // Find user's Stripe customer ID
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { stripeCustomerId: true },
      });
      const currentPaidSubscription = await getCurrentPaidSubscription(user.id);
      const stripeCustomerId =
        currentPaidSubscription?.stripeCustomerId || dbUser?.stripeCustomerId;

      if (!stripeCustomerId) {
        return c.json(
          {
            success: false,
            message: DEFAULT_NO_PAID_SUBSCRIPTION_MESSAGE,
          },
          404
        );
      }

      // Find active/trialing/past_due subscriptions for this customer
      const stripeSubscriptions = await stripeClient.subscriptions.list({
        customer: stripeCustomerId,
        status: "all",
        limit: 10,
      });

      const syncableSubscription = pickSyncableSubscription(stripeSubscriptions.data);

      if (!syncableSubscription) {
        return c.json(
          {
            success: false,
            message: DEFAULT_NO_PAID_SUBSCRIPTION_MESSAGE,
          },
          404
        );
      }

      const dbSubscription = await syncSubscriptionFromStripe(
        syncableSubscription,
        user.id
      );

      if (!dbSubscription) {
        return c.json(
          {
            success: false,
            message: "Failed to sync subscription to database. Please try again later.",
          },
          500
        );
      }

      return c.json({
        success: true,
        message: "Subscription synced successfully",
        data: {
          subscriptionId: dbSubscription.id,
          creditsLimit: dbSubscription.creditsLimit,
          creditsUsed: dbSubscription.creditsUsed,
          imagesLimit: dbSubscription.imagesLimit,
          imagesUsed: dbSubscription.imagesUsed,
        },
      });
    } catch (error) {
      console.error("Sync subscription error:", error);

      // Ensure we always return valid JSON
      if (error instanceof HTTPException) {
        return c.json(
          {
            success: false,
            message: error.message || "Failed to sync subscription",
          },
          error.status
        );
      }

      return c.json(
        {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to sync subscription. Please try again later.",
        },
        500
      );
    }
  })
  .get("/generations", getAuthUser, async (c) => {
    try {
      const user = c.get("user");
      const data = await checkGenerationLimit(user.id);
      return c.json({
        success: true,
        data,
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      throw new HTTPException(500, {
        message: "Failed to retrieve generations data.",
      });
    }
  });
