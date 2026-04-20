import { PLAN_ENUM, type PlanEnumType } from "@/lib/constant";
import type { ChatModel } from "@/lib/ai/models";

export const FREE_MAX_OUTPUT_TOKENS = 1024;

export const FREE_MODEL_UPGRADE_MESSAGE =
  "This model is not available on the Free plan. Please upgrade to continue.";

export type PlanAccessPlan = PlanEnumType | string | null | undefined;

export function isFreePlan(plan: PlanAccessPlan) {
  return !plan || plan === PLAN_ENUM.FREE;
}

export function isModelLockedForPlan(
  plan: PlanAccessPlan,
  model: Pick<ChatModel, "id" | "name">
) {
  if (!isFreePlan(plan)) {
    return false;
  }

  const id = model.id.toLowerCase();
  const name = model.name.toLowerCase();

  return (
    id.startsWith("anthropic/") ||
    name.includes("claude") ||
    (id.startsWith("openai/") && id.includes("gpt-5")) ||
    id.includes("google/gemini") ||
    name.includes("gemini") ||
    id.includes("moonshotai/kimi") ||
    name.includes("kimi") ||
    id.includes("x-ai/grok") ||
    name.includes("grok") ||
    id.includes("mistralai/mistral") ||
    name.includes("mistral")
  );
}

export function getEffectiveMaxOutputTokens(
  plan: PlanAccessPlan,
  requestedMaxOutputTokens?: number
) {
  if (!isFreePlan(plan)) {
    return requestedMaxOutputTokens;
  }

  if (!requestedMaxOutputTokens) {
    return FREE_MAX_OUTPUT_TOKENS;
  }

  return Math.min(requestedMaxOutputTokens, FREE_MAX_OUTPUT_TOKENS);
}

export function getDefaultModelForPlan(
  plan: PlanAccessPlan,
  models: ChatModel[],
  preferredModelId?: string
) {
  const preferredModel = preferredModelId
    ? models.find((model) => model.id === preferredModelId)
    : null;

  if (preferredModel && !isModelLockedForPlan(plan, preferredModel)) {
    return preferredModel;
  }

  return (
    models.find((model) => !isModelLockedForPlan(plan, model)) ||
    models[0] ||
    null
  );
}
