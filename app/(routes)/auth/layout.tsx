import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    // Only redirect users who are FULLY verified (signed in + email confirmed).
    // Users who just registered and haven't verified yet will have emailVerified = false,
    // so they are allowed to stay on the verify-email page.
    if (session?.user.emailVerified) {
      return redirect("/home");
    }
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("Database connection error in AuthLayout:", error);
  }

  return <div>{children}</div>;
}
