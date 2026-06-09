"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

const COOKIE_NOTICE_KEY = "quizio-cookie-notice";

export function CookieDisclaimer() {
  const t = useTranslations("cookies");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        setIsVisible(window.localStorage.getItem(COOKIE_NOTICE_KEY) !== "accepted");
      } catch {
        setIsVisible(true);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  function acceptNotice() {
    try {
      window.localStorage.setItem(COOKIE_NOTICE_KEY, "accepted");
    } catch {
      // The notice can still be dismissed for this render.
    }
    setIsVisible(false);
  }

  if (!isVisible) {
    return null;
  }

  return (
    <section
      aria-label={t("label")}
      className="fixed bottom-4 left-4 right-4 z-50 border-2 border-[#211F20] bg-[#FFFDF8] p-4 shadow-[6px_6px_0_#211F20] md:left-auto md:max-w-[460px]"
    >
      <p className="font-display text-2xl leading-none text-[#211F20]">
        {t("title")}
      </p>
      <p className="mt-2 text-[14px] leading-5 text-[#211F20]">
        {t("body")}
      </p>
      <Button
        className="q-button q-button-primary mt-4 h-11 rounded-none border-[#006E5A] bg-[#006E5A] px-4 text-[15px] transition hover:-translate-y-0.5 hover:bg-[#005647]"
        onClick={acceptNotice}
        type="button"
      >
        {t("accept")}
      </Button>
    </section>
  );
}
