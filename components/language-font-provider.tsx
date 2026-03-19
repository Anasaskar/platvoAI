"use client";

import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";

/**
 * Component that applies language-specific attributes and font classes to the document
 */
export function LanguageFontProvider() {
  const { language } = useLanguage();

  useEffect(() => {
    const html = document.documentElement;

    if (language === "ar") {
      // RTL layout + Arabic font
      html.setAttribute("dir", "rtl");
      html.setAttribute("lang", "ar");
      html.classList.add("lang-ar");
      document.body.classList.add("font-arabic");
    } else {
      // LTR layout + default font
      html.setAttribute("dir", "ltr");
      html.setAttribute("lang", "en");
      html.classList.remove("lang-ar");
      document.body.classList.remove("font-arabic");
    }
  }, [language]);

  return null;
}
