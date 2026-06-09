"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, RotateCcw } from "lucide-react";

import { routes } from "@/lib/navigation/routes";

type AdminRouteErrorProps = {
  eyebrow: string;
  message: string;
  reset: () => void;
};

export function AdminRouteError({
  eyebrow,
  message,
  reset,
}: AdminRouteErrorProps) {
  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <header className="q-container py-5 md:py-7">
        <Link
          className="font-display text-5xl leading-none text-[#006E5A]"
          href={routes.home}
        >
          Quizio
        </Link>
      </header>

      <section className="q-container pb-12 pt-6 md:pb-20 md:pt-10">
        <div className="border-2 border-[#FF3C38] bg-[#FFFDF8] p-6 shadow-[6px_6px_0_#EBE4D8]">
          <AlertCircle className="mb-5 h-12 w-12 text-[#FF3C38]" />

          <p className="mb-3 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
            {eyebrow}
          </p>
          <h1 className="font-display text-[54px] leading-[0.9] text-[#211F20] md:text-[82px]">
            Results could not be loaded.
          </h1>
          <p className="mt-4 max-w-2xl q-body text-[#211F20]">{message}</p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              className="q-button q-button-primary h-11 border-[#FF3C38] bg-[#FF3C38] px-5 text-[16px]"
              onClick={reset}
              type="button"
            >
              <RotateCcw className="h-4 w-4" />
              Try again
            </button>
            <Link
              className="q-button q-button-secondary h-11 px-5 text-[16px]"
              href={routes.admin}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to admin
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
