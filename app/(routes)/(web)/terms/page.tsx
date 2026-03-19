"use client";

import { useTranslation } from "@/lib/i18n";

export default function TermsOfService() {
    const t = useTranslation();
    return (
        <main className="w-full relative">
            <div className="relative">
                <div className="mx-auto max-w-4xl px-4 pb-8 md:pb-12">
                    <div className="mt-8 md:mt-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 md:p-12 shadow-xl border border-teal-100 dark:border-teal-900/30">
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-500 mb-8">
                            {t("terms.title")}
                        </h1>

                        <div className="prose prose-teal dark:prose-invert max-w-none space-y-6 text-slate-700 dark:text-slate-300">
                            <p>{t("terms.lastUpdated")}: {new Date().toLocaleDateString()}</p>

                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">{t("terms.section1Title")}</h2>
                            <p>{t("terms.section1Desc")}</p>

                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">{t("terms.section2Title")}</h2>
                            <p>{t("terms.section2Desc")}</p>

                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">{t("terms.section3Title")}</h2>
                            <p>{t("terms.section3Desc")}</p>

                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">{t("terms.section4Title")}</h2>
                            <p>{t("terms.section4Desc")}</p>

                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-8 mb-4">{t("terms.section5Title")}</h2>
                            <p>{t("terms.section5Desc")}</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
