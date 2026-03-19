"use client";

import { useEffect } from "react";
import AppPreview from "./_common/app-preview";
import Hero from "./_common/hero";
import ProblemSection from "./_common/problem-section";
import ModelsPricingSection from "./_common/models-pricing-section";

declare global {
  interface Window {
    $crisp: unknown[];
    CRISP_WEBSITE_ID?: string;
  }
}

export default function Home() {
  useEffect(() => {
    // Initialize Crisp chatbot only on homepage
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = "ee4bf75f-279a-432a-a535-dc604b734577";
    
    const script = document.createElement("script");
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;
    document.getElementsByTagName("head")[0].appendChild(script);

    // Cleanup: Remove Crisp when component unmounts (e.g., navigating to /home)
    return () => {
      // Remove the script element
      const crispScript = document.querySelector('script[src="https://client.crisp.chat/l.js"]');
      if (crispScript) {
        crispScript.remove();
      }
      // Clear Crisp data
      if (window.$crisp) {
        window.$crisp = [];
      }
      if (window.CRISP_WEBSITE_ID) {
        window.CRISP_WEBSITE_ID = undefined;
      }
      // Remove Crisp iframe/widget if it exists
      const crispWidget = document.querySelector('#crisp-chatbox, [data-crisp-widget]');
      if (crispWidget) {
        crispWidget.remove();
      }
    };
  }, []);
  return (
    <main className="w-full relative">
      <div className="relative">
        {/* Your Content/Components */}
        <div className="mx-auto max-w-6xl px-4 pb-6 md:pb-8">
          <Hero />
          <AppPreview />
          <ProblemSection />
          <ModelsPricingSection />
        </div>
      </div>

    </main>
  );
}
