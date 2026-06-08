"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock3, Inbox } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  DashboardEmptyState,
  DashboardSectionTitle,
} from "@/components/dashboard/DashboardPanelPrimitives";
import { Separator } from "@/components/ui/separator";
import { routes } from "@/lib/navigation/routes";

export type OpenSessionView = {
  attemptId: number;
  quizId: number;
  quizTitle: string;
  timeLeftSeconds: number;
  startedAt: string;
};

export function DashboardOpenSessionsPanel({
  sessions,
}: {
  sessions: OpenSessionView[];
}) {
  const t = useTranslations("dashboard");
  const [nowTick, setNowTick] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowTick((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const activeSessions = sessions
    .map((session) => ({
      ...session,
      timeLeftSeconds: Math.max(0, session.timeLeftSeconds - nowTick),
    }))
    .filter((session) => session.timeLeftSeconds > 0);

  return (
    <section className="border-2 border-[var(--q-muted-strong)] bg-[var(--q-surface)] p-5 md:p-6">
      <DashboardSectionTitle
        eyebrow={t("inProgress")}
        title={t("openSessions")}
      />
      <Separator className="my-4 h-[2px] bg-[var(--q-border)]" />

      {activeSessions.length === 0 ? (
        <DashboardEmptyState
          icon={<Inbox className="h-8 w-8" />}
          title={t("noActiveSessions")}
          description={t("startQuizHistory")}
        />
      ) : (
        <div className="grid gap-3">
          {activeSessions.map((session) => (
            <article
              key={session.attemptId}
              className="grid gap-4 border border-[var(--q-muted-strong)] bg-[var(--q-surface-alt)] p-4 md:grid-cols-[1fr_auto] md:items-center"
            >
              <div>
                <p className="font-display text-2xl leading-none text-[var(--q-ink)]">
                  {session.quizTitle}
                </p>
                <p className="mt-1 q-mini text-[var(--q-ink-muted)]">
                  {t("started", { date: session.startedAt })}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 md:justify-end">
                <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--q-green)]">
                  <Clock3 className="h-4 w-4" />
                  {t("timeLimit", {
                    time: formatTimeLeft(session.timeLeftSeconds),
                  })}
                </span>
                <Link
                  href={routes.attempt(session.quizId)}
                  className="q-button q-button-secondary"
                >
                  {t("continue")}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function formatTimeLeft(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
