"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Archive,
  CalendarClock,
  FilePenLine,
  MoreVertical,
  Send,
  Users,
  X,
} from "lucide-react";

import type { AdminQuizListItem } from "@/components/admin/data/quiz-mappers";
import {
  archiveQuiz,
  publishQuizNow,
  scheduleQuizRelease,
  toDatetimeLocalValue,
  validateScheduledPublish,
} from "@/components/admin/admin-quiz-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { routes } from "@/lib/navigation/routes";

type PendingAction = "publish-now" | "schedule" | "archive";

type AdminQuizMobileActionsProps = {
  quiz: AdminQuizListItem;
};

export function AdminQuizMobileActions({ quiz }: AdminQuizMobileActionsProps) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(() =>
    quiz.publishAt ? toDatetimeLocalValue(new Date(quiz.publishAt)) : ""
  );
  const [minPublishAt] = useState(() => toDatetimeLocalValue(new Date()));
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const isDraft = quiz.status === "draft";
  const isScheduled = quiz.status === "scheduled";
  const isPublished = quiz.status === "published";
  const isArchived = quiz.status === "archived";
  const canPublish = isDraft || isScheduled;
  const canEdit = isDraft || isScheduled;
  const isPending = pendingAction !== null;

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.body.classList.add("overflow-hidden");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("overflow-hidden");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function runAction(
    action: PendingAction,
    request: () => Promise<unknown>
  ) {
    setActionError(null);
    setPendingAction(action);

    try {
      await request();
      setOpen(false);
      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t("actionFailed"));
    } finally {
      setPendingAction(null);
    }
  }

  function handlePublishNow() {
    void runAction("publish-now", () => publishQuizNow(quiz));
  }

  function handleSchedulePublish() {
    const scheduledPublish = validateScheduledPublish(scheduledAt);

    if (scheduledPublish === "missing") {
      setActionError(t("choosePublishTime"));
      return;
    }

    if (scheduledPublish === "past") {
      setActionError(t("chooseFutureTime"));
      return;
    }

    void runAction("schedule", () =>
      scheduleQuizRelease(quiz, scheduledPublish.toISOString())
    );
  }

  function handleArchive() {
    void runAction("archive", () => archiveQuiz(quiz));
  }

  const actionSheet = open ? (
    <div
      className="fixed inset-0 z-[1000] bg-[#211F20]/45 p-3 lg:hidden"
      onClick={() => setOpen(false)}
    >
      <div
        aria-labelledby={`mobile-quiz-actions-${quiz.id}`}
        aria-modal="true"
        className="flex max-h-[calc(100dvh-1.5rem)] min-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden border-2 border-[#211F20] bg-[#FFFAF2] text-[#211F20] shadow-[6px_6px_0_#211F20] animate-in fade-in slide-in-from-bottom-4 duration-200"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b-2 border-[#211F20] bg-[#FFFDF8] p-5">
          <div className="min-w-0">
            <p className="mb-2 q-mini font-bold uppercase tracking-[0.16em] text-[#006E5A]">
              {t("actions")}
            </p>
            <h2
              className="font-display text-[38px] leading-[0.88]"
              id={`mobile-quiz-actions-${quiz.id}`}
            >
              {quiz.title}
            </h2>
            <p className="mt-2 q-mini text-[#6F6758]">
              {getStatusLabel(quiz.status, t)}
            </p>
          </div>

          <button
            aria-label="Close quiz actions"
            className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#211F20] bg-[#FFFAF2] text-[#211F20] transition hover:-translate-y-0.5 hover:bg-[#EBE4D8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006E5A]"
            onClick={() => setOpen(false)}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid flex-1 content-start gap-4 overflow-y-auto p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {canPublish ? (
            <section className="grid gap-3 border-2 border-[#211F20] bg-[#FFFDF8] p-4 shadow-[4px_4px_0_#EBE4D8]">
              <label className="grid gap-2" htmlFor={`publish-at-${quiz.id}`}>
                <span className="q-mini font-bold uppercase text-[#006E5A]">
                  {t("exactReleaseTime")}
                </span>
                <Input
                  className="h-11 rounded-none border-2 border-[#211F20] bg-[#FFFAF2] text-[15px] shadow-none focus-visible:border-[#006E5A] focus-visible:ring-0"
                  disabled={isPending}
                  id={`publish-at-${quiz.id}`}
                  min={minPublishAt}
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  className="q-button q-button-secondary h-12 rounded-none border-2 border-[#211F20] bg-[#FFFAF2] text-[16px] transition hover:-translate-y-0.5 hover:bg-[#EBE4D8]"
                  disabled={isPending}
                  onClick={handleSchedulePublish}
                  type="button"
                  variant="outline"
                >
                  <CalendarClock className="h-4 w-4" />
                  {pendingAction === "schedule"
                    ? t("saving")
                    : isScheduled
                      ? t("updateTime")
                      : t("schedule")}
                </Button>

                <Button
                  className="q-button q-button-primary h-12 rounded-none border-[#006E5A] bg-[#006E5A] text-[16px] transition hover:-translate-y-0.5 hover:bg-[#005647]"
                  disabled={isPending}
                  onClick={handlePublishNow}
                  type="button"
                >
                  <Send className="h-4 w-4" />
                  {pendingAction === "publish-now"
                    ? t("publishing")
                    : t("publishNow")}
                </Button>
              </div>
            </section>
          ) : isPublished ? (
            <section className="border-2 border-[#006E5A] bg-[#DDECE8] p-4">
              <p className="q-mini font-bold uppercase text-[#006E5A]">
                {t("locked")}
              </p>
              <p className="mt-1 text-[14px] leading-6">{quiz.publishAtLabel}</p>
            </section>
          ) : null}

          <div className="grid gap-3">
            {isPublished ? (
              <Button
                asChild
                className="q-button q-button-secondary h-12 rounded-none border-2 border-[#211F20] bg-[#FFFDF8] text-[16px] transition hover:-translate-y-0.5 hover:bg-[#EBE4D8]"
                variant="outline"
              >
                <Link href={routes.adminQuizResults(quiz.id)}>
                  <Users className="h-4 w-4" />
                  {t("results")}
                </Link>
              </Button>
            ) : (
              <Button
                className="q-button q-button-secondary h-12 cursor-not-allowed rounded-none border-2 border-[#D7D0C4] bg-[#FFFDF8] text-[16px] text-[#8F8F8F] opacity-60"
                disabled
                type="button"
                variant="outline"
              >
                <Users className="h-4 w-4" />
                {t("results")}
              </Button>
            )}

            {canEdit ? (
              <Button
                asChild
                className="q-button q-button-secondary h-12 rounded-none border-2 border-[#211F20] bg-[#FFFDF8] text-[16px] transition hover:-translate-y-0.5 hover:bg-[#EBE4D8]"
                variant="outline"
              >
                <Link href={routes.adminQuizDetail(quiz.id)}>
                  <FilePenLine className="h-4 w-4" />
                  {t("edit")}
                </Link>
              </Button>
            ) : null}

            {!isArchived ? (
              <Button
                className="q-button q-button-primary h-12 rounded-none border-[#FF3C38] bg-[#FF3C38] text-[16px] transition hover:-translate-y-0.5 hover:bg-[#D92F2B]"
                disabled={isPending}
                onClick={handleArchive}
                type="button"
              >
                <Archive className="h-4 w-4" />
                {pendingAction === "archive" ? t("saving") : t("archive")}
              </Button>
            ) : null}
          </div>

          {actionError ? (
            <p className="border-2 border-[#FF3C38] bg-[#FFFDF8] p-3 q-mini font-bold uppercase text-[#FF3C38]">
              {actionError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div
      className="flex items-stretch lg:hidden"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`${t("actions")} ${quiz.title}`}
        className="flex h-full min-h-[92px] w-11 items-center justify-center border-l-2 border-[#EBE4D8] bg-[#FFFAF2] text-[#211F20] transition hover:bg-[#EBE4D8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#006E5A]"
        onClick={() => setOpen(true)}
        type="button"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {actionSheet ? createPortal(actionSheet, document.body) : null}
    </div>
  );
}

function getStatusLabel(
  status: AdminQuizListItem["status"],
  t: ReturnType<typeof useTranslations<"admin">>
) {
  if (status === "draft") {
    return t("draft");
  }
  if (status === "scheduled") {
    return t("scheduled");
  }
  if (status === "published") {
    return t("published");
  }
  return t("archived");
}

