import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

import Navbar from "./_common/nav-bar";
import Footer from "./_common/footer";

export default async function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(), // you need to pass the headers object.
    });

    if (session) {
      return redirect("/home");
    }
  } catch (error: unknown) {
    // Next.js redirect() throws a special error that should not be caught
    // Check if this is a redirect error and re-throw it
    if (error && typeof error === "object" && "digest" in error && typeof error.digest === "string" && error.digest.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    
    // Handle database connection errors gracefully
    // If database is unavailable, allow the page to render without session check
    console.error("Database connection error in WebLayout:", error);
    // Continue to render children even if session check fails
  }

  return (
    <div className="min-h-dvh flex flex-col relative w-full">
      {/* Global Background */}
      <div
        className="
          absolute inset-0 z-0
          bg-[radial-gradient(125%_125%_at_50%_90%,#ffffff_40%,#10b981_100%)]
          dark:bg-[radial-gradient(125%_125%_at_50%_90%,#0f172a_40%,#10b981_100%)]
        "
      >
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(226,232,240,0.2) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(226,232,240,0.2) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            WebkitMaskImage:
              "radial-gradient(circle at 50% 40%, rgba(0,0,0,0.9) 70%, transparent 100%)",
            maskImage:
              "radial-gradient(circle at 50% 40%, rgba(0,0,0,0.9) 70%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(51,65,85,0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(51,65,85,0.25) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            WebkitMaskImage:
              "radial-gradient(circle at 50% 40%, rgba(0,0,0,0.85) 65%, transparent 100%)",
            maskImage:
              "radial-gradient(circle at 50% 40%, rgba(0,0,0,0.85) 65%, transparent 100%)",
          }}
        />
      </div>

      <div className="w-full relative z-10 mx-auto max-w-6xl px-4 pt-6 md:pt-8 pb-4">
        <Navbar />
      </div>
      
      <div className="flex-1 w-full relative z-10 flex flex-col">
        {children}
      </div>
      
      <div className="mt-auto w-full relative z-10">
        <Footer />
      </div>
    </div>
  );
}
