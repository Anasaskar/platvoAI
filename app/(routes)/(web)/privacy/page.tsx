"use client";

import Navbar from "../_common/nav-bar";
import Footer from "../_common/footer";

export default function PrivacyPolicy() {
    return (
        <main className="min-h-dvh w-full relative">
            <div className="absolute inset-0 z-0 bg-[radial-gradient(125%_125%_at_50%_90%,#ffffff_40%,#10b981_100%)] dark:bg-[radial-gradient(125%_125%_at_50%_90%,#0f172a_40%,#10b981_100%)]">
                <div
                    className="absolute inset-0 dark:hidden"
                    style={{
                        backgroundImage: `linear-gradient(to right, rgba(226,232,240,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(226,232,240,0.2) 1px, transparent 1px)`,
                        backgroundSize: "60px 60px",
                        WebkitMaskImage: "radial-gradient(circle at 50% 40%, rgba(0,0,0,0.9) 70%, transparent 100%)",
                        maskImage: "radial-gradient(circle at 50% 40%, rgba(0,0,0,0.9) 70%, transparent 100%)",
                    }}
                />
                <div
                    className="absolute inset-0 hidden dark:block"
                    style={{
                        backgroundImage: `linear-gradient(to right, rgba(51,65,85,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(51,65,85,0.25) 1px, transparent 1px)`,
                        backgroundSize: "60px 60px",
                        WebkitMaskImage: "radial-gradient(circle at 50% 40%, rgba(0,0,0,0.85) 65%, transparent 100%)",
                        maskImage: "radial-gradient(circle at 50% 40%, rgba(0,0,0,0.85) 65%, transparent 100%)",
                    }}
                />
            </div>

            <div className="relative">
                <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
                    <Navbar />

                    <div className="mt-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 md:p-12 shadow-xl border border-teal-100 dark:border-teal-900/30">
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-500 mb-8">
                            Privacy Policy
                        </h1>

                        <div className="prose prose-teal dark:prose-invert max-w-none space-y-6 text-slate-700 dark:text-slate-300">
                            <p>Last updated: {new Date().toLocaleDateString()}</p>

                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">1. Information We Collect</h2>
                            <p>We collect information you provide directly to us when you use our services, including but not limited to your name, email address, and any prompts or content you generate using our AI models.</p>

                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">2. How We Use Your Information</h2>
                            <p>We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to personalize your experience. Your data is used to process your AI generations across our supported models.</p>

                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">3. Data Sharing and Security</h2>
                            <p>We do not sell your personal information. We share information only with trusted third-party service providers (such as AI API providers: OpenAI, OpenRouter, Replicate) strictly for the purpose of fulfilling your requests.</p>

                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">4. Your Rights</h2>
                            <p>You have the right to access, update, and delete your personal information. You can manage your data through your account settings or by contacting our support team.</p>

                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">5. Revisions to this Policy</h2>
                            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        </main>
    );
}
