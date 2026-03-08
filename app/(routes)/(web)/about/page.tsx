"use client";

import Navbar from "../_common/nav-bar";
import Footer from "../_common/footer";
import { SparklesCore } from "@/components/ui/sparkles";

export default function AboutUs() {
    return (
        <main className="min-h-dvh w-full relative">
            <div className="absolute inset-0 z-0 bg-[radial-gradient(125%_125%_at_50%_90%,#ffffff_40%,#10b981_100%)] dark:bg-[radial-gradient(125%_125%_at_50%_90%,#0f172a_40%,#10b981_100%)]">
                <div className="absolute inset-0 w-full h-full">
                    <SparklesCore
                        id="aboutBackground"
                        background="transparent"
                        minSize={0.6}
                        maxSize={1.4}
                        particleDensity={100}
                        className="w-full h-full"
                        particleColor="#10b981"
                    />
                </div>
            </div>

            <div className="relative z-10 w-full">
                <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
                    <Navbar />

                    <div className="mt-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 md:p-12 shadow-xl border border-teal-100 dark:border-teal-900/30">
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-500 mb-8 text-center">
                            About Us
                        </h1>

                        <div className="flex flex-col md:flex-row gap-12 items-center mt-12">
                            <div className="w-full md:w-1/2 space-y-6 text-slate-700 dark:text-slate-300 text-lg leading-relaxed">
                                <p>
                                    At <strong className="text-teal-600 dark:text-teal-400">Platvo AI</strong>, we believe that the power of artificial intelligence should be accessible, seamless, and unified.
                                </p>
                                <p>
                                    Navigating multiple subscriptions, different interfaces, and fragmented tools can decrease productivity. We set out to change that by building a single, cohesive platform that integrates the world's best AI models under one roof.
                                </p>
                                <p>
                                    Whether you are generating high-quality images, brainstorming with advanced LLMs, or automating deep workflows with tools and agents, we provide an intuitive space to bring your ideas to life.
                                </p>
                            </div>

                            <div className="w-full md:w-1/2 rounded-2xl overflow-hidden shadow-2xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-slate-800 p-8 flex flex-col items-center justify-center text-center">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Our Mission</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    To democratize access to state-of-the-art AI by providing a unified, blazing-fast, and cost-effective platform for creators and developers alike.
                                </p>
                                <div className="flex space-x-4">
                                    <span className="inline-flex items-center justify-center p-3 bg-teal-100 dark:bg-teal-900/50 rounded-full text-teal-600 dark:text-teal-400">
                                        Faster
                                    </span>
                                    <span className="inline-flex items-center justify-center p-3 bg-teal-100 dark:bg-teal-900/50 rounded-full text-teal-600 dark:text-teal-400">
                                        Smarter
                                    </span>
                                    <span className="inline-flex items-center justify-center p-3 bg-teal-100 dark:bg-teal-900/50 rounded-full text-teal-600 dark:text-teal-400">
                                        Unified
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        </main>
    );
}
