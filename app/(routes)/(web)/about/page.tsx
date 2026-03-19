"use client";

import { useTranslation } from "@/lib/i18n";

export default function AboutUs() {
    const t = useTranslation();
    return (
        <main className="w-full relative">
            <div className="relative z-10 w-full">
                <div className="mx-auto max-w-5xl px-4 pb-8 md:pb-12">
                    <div className="mt-8 md:mt-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 md:p-12 shadow-xl border border-teal-100 dark:border-teal-900/30">
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-500 mb-4 text-center">
                            {t("about.title")}
                        </h1>
                        <p className="text-center text-slate-500 dark:text-slate-400 mb-12 text-lg">
                            {t("about.subtitle")}
                        </p>

                        <div className="flex flex-col md:flex-row gap-12 items-center">
                            <div className="w-full md:w-1/2 space-y-6 text-slate-700 dark:text-slate-300 text-lg leading-relaxed">
                                <p>
                                    {t("about.paragraph1").split("Platvo AI")[0]}
                                    <strong className="text-teal-600 dark:text-teal-400">Platvo AI</strong>
                                    {t("about.paragraph1").split("Platvo AI")[1]}
                                </p>
                                <p>
                                    {t("about.paragraph2")}
                                </p>
                                <p>
                                    {t("about.paragraph3")}
                                </p>
                            </div>

                            <div className="w-full md:w-1/2 rounded-2xl overflow-hidden shadow-2xl border border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-slate-800 dark:to-slate-900 p-8 flex flex-col items-center justify-center text-center gap-6">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{t("about.missionTitle")}</h3>
                                <p className="text-slate-600 dark:text-slate-400">
                                    {t("about.missionDesc")}
                                </p>
                                <div className="flex gap-3 flex-wrap justify-center">
                                    {[t("about.tags.faster"), t("about.tags.smarter"), t("about.tags.unified")].map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center justify-center px-4 py-2 bg-teal-100 dark:bg-teal-900/50 rounded-full text-teal-700 dark:text-teal-400 font-medium text-sm"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-teal-100 dark:border-teal-900/30">
                            {[
                                { label: t("about.stats.models"), value: "13+" },
                                { label: t("about.stats.users"), value: "500+" },
                                { label: t("about.stats.generations"), value: "10K+" },
                                { label: t("about.stats.uptime"), value: "99.9%" },
                            ].map(({ label, value }) => (
                                <div key={label} className="text-center">
                                    <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">{value}</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
