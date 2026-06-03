"use client";

import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo, useState, Suspense, type ReactNode } from "react";
import {
  Archive,
  CalendarClock,
  Clock3,
  Eye,
  FilePlus2,
  ListChecks,
  Pencil,
  Search,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminQuizListItem } from "@/lib/admin-quiz-mappers";
import {
  buildCreateQuizPayloadFromFullQuiz,
  replaceLockedQuiz,
  type QuizPublishPayload,
} from "@/lib/admin-quiz-replacement";
import { cn } from "@/lib/utils";
import { proxyFetchJson } from "@/lib/proxyClient";
import { routes } from "@/lib/routes";
import type { QuizFullResponse, QuizResponse } from "@/lib/types";

type StatusFilter = "all" | AdminQuizListItem["status"];

const activeStatuses: StatusFilter[] = [
  "all",
  "draft",
  "scheduled",
  "published",
];
const archivedStatuses: StatusFilter[] = ["all", "archived"];

const statusLabels: Record<StatusFilter, string> = {
  all: "All",
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
  archived: "Archived",
};

type AdminQuizBrowserProps = {
  quizzes: AdminQuizListItem[];
  archivedView?: boolean;
};

export function AdminQuizBrowser({
  quizzes,
  archivedView = false,
}: AdminQuizBrowserProps) {
  return (
    <Suspense fallback={null}>
      <AdminQuizBrowserInner quizzes={quizzes} archivedView={archivedView} />
    </Suspense>
  );
}

function AdminQuizBrowserInner({
  quizzes,
  archivedView = false,
}: AdminQuizBrowserProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState(() => searchParams.get("query") || "");
  const [status, setStatus] = useState<StatusFilter>(
    () => (searchParams.get("status") as StatusFilter) || "all"
  );
  
  const statusOptions = archivedView ? archivedStatuses : activeStatuses;

  useEffect(() => {
    setQuery(searchParams.get("query") || "");
    setStatus((searchParams.get("status") as StatusFilter) || "all");
  }, [searchParams]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      
      if (query) params.set("query", query);
      else params.delete("query");
      
      if (status !== "all") params.set("status", status);
      else params.delete("status");
      
      const newSearch = params.toString();
      if (newSearch !== searchParams.toString()) {
        router.replace(`${pathname}?${newSearch}`, { scroll: false });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, status, pathname, router, searchParams]);

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const search = query.toLowerCase();

      const matchesQuery =
        quiz.title.toLowerCase().includes(search) ||
        quiz.description.toLowerCase().includes(search) ||
        quiz.category.toLowerCase().includes(search) ||
        quiz.publishAtLabel.toLowerCase().includes(search);

      const matchesStatus = status === "all" || quiz.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [quizzes, query, status]);

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8F8F8F]" />
          <Input
            className="q-input h-12 pl-12"
            placeholder={
              archivedView
                ? "Search archived quizzes..."
                : "Search admin quizzes..."
            }
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        {archivedView ? (
          <Button
            asChild
            className="q-button q-button-secondary h-12 rounded-none"
            variant="outline"
          >
            <Link href={routes.admin}>
              <ListChecks data-icon="inline-start" />
              Active quizzes
            </Link>
          </Button>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              asChild
              className="q-button q-button-secondary h-12 rounded-none"
              variant="outline"
            >
              <Link href={routes.adminArchivedQuizzes}>
                <Archive data-icon="inline-start" />
                Archived
              </Link>
            </Button>

            <Button
              asChild
              className="q-button q-button-primary h-12 rounded-none border-[#FF3C38] bg-[#FF3C38]"
            >
              <Link href={routes.adminQuizNew}>
                <FilePlus2 data-icon="inline-start" />
                Create quiz
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusOptions.map((item) => (
          <Button
            key={item}
            type="button"
            onClick={() => setStatus(item)}
            className={cn(
              "q-button shrink-0 rounded-none",
              status === item
                ? "q-button-primary border-[#006E5A] bg-[#006E5A]"
                : "q-button-secondary"
            )}
            variant={status === item ? "default" : "outline"}
          >
            {statusLabels[item]}
          </Button>
        ))}
      </div>

      <div className="flex items-center justify-between border-y-2 border-[#211F20] py-3">
        <p className="q-body">
          Showing{" "}
          <strong className="text-[#006E5A]">{filteredQuizzes.length}</strong>{" "}
          {archivedView ? "archived quizzes" : "quizzes"}
        </p>

        <p className="q-mini text-[#8F8F8F]">
          {archivedView ? "Archived content" : "Admin content management"}
        </p>
      </div>

      <div className="grid gap-4">
        {filteredQuizzes.length > 0 ? (
          filteredQuizzes.map((quiz) => (
            <AdminQuizCard key={quiz.id} quiz={quiz} />
          ))
        ) : (
          <div className="border-2 border-[#EBE4D8] bg-[#FFFAF2] p-5">
            <p className="font-display text-3xl leading-none text-[#211F20]">
              No quizzes found
            </p>
            <p className="mt-2 q-body text-[#211F20]">
              Adjust the search or status filter to see more results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminQuizCard({ quiz }: { quiz: AdminQuizListItem }) {
  return (
    <article className="grid gap-5 border-2 border-[#211F20] bg-[#FFFAF2] p-5 transition hover:shadow-[6px_6px_0_#EBE4D8] xl:grid-cols-[minmax(0,1fr)_300px]">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h2 className="font-display text-[34px] leading-none text-[#211F20]">
            {quiz.title}
          </h2>

          <StatusBadge status={quiz.status} />

          <Badge
            className="rounded-none border-0 bg-[#DDECE8] px-2 py-1 text-[12px] leading-4 text-[#006E5A]"
            variant="secondary"
          >
            {quiz.category}
          </Badge>
        </div>

        <p className="max-w-3xl q-body text-[#211F20]">{quiz.description}</p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <MetaItem
            icon={<ListChecks className="h-4 w-4" />}
            label="Questions"
            value={`${quiz.questionCount}`}
          />
          <MetaItem
            icon={<Clock3 className="h-4 w-4" />}
            label="Time"
            value={`${quiz.timeLimitMinutes} min`}
          />
          <MetaItem
            icon={<Users className="h-4 w-4" />}
            label="Attempts"
            value={formatAttemptCount(quiz.attempts)}
          />
          <MetaItem
            icon={<Archive className="h-4 w-4" />}
            label="Created"
            value={quiz.createdAt}
          />
          <MetaItem
            icon={<CalendarClock className="h-4 w-4" />}
            label="Release"
            value={getPublishMetaText(quiz)}
          />
        </div>
      </div>

      <AdminQuizActions quiz={quiz} />
    </article>
  );
}

type PendingAction = "publish-now" | "schedule" | "archive";

function AdminQuizActions({ quiz }: { quiz: AdminQuizListItem }) {
  const router = useRouter();
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
  const canEdit = isDraft || isScheduled;
  const isPending = pendingAction !== null;

  async function runAction(
    action: PendingAction,
    request: () => Promise<unknown>
  ) {
    setActionError(null);
    setPendingAction(action);

    try {
      await request();
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Action failed.";
      setActionError(message);
    } finally {
      setPendingAction(null);
    }
  }

  function handlePublishNow() {
    void runAction("publish-now", () => publishQuizNow(quiz));
  }

  function handleSchedulePublish() {
    const publishDate = parseDatetimeLocalValue(scheduledAt);

    if (!publishDate) {
      setActionError("Choose an exact publish time first.");
      return;
    }

    if (publishDate.getTime() <= Date.now()) {
      setActionError("Choose a future time or use Publish now.");
      return;
    }

    void runAction("schedule", () =>
      scheduleQuizRelease(quiz, publishDate.toISOString())
    );
  }

  function handleArchive() {
    void runAction("archive", () =>
      proxyFetchJson<QuizResponse>(`/quizzes/${quiz.id}/archive`, {
        method: "PATCH",
        body: { is_archived: true },
      })
    );
  }

  return (
    <div className="grid content-start gap-3 xl:w-[300px]">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {canEdit ? (
          <Button
            asChild
            className="q-button q-button-primary rounded-none border-[#211F20] bg-[#211F20]"
          >
            <Link href={routes.adminQuizDetail(quiz.id)}>
              <Pencil data-icon="inline-start" />
              Edit
            </Link>
          </Button>
        ) : (
          <Button
            className="q-button q-button-disabled rounded-none"
            disabled
            type="button"
          >
            <ShieldCheck data-icon="inline-start" />
            {isArchived ? "Archived" : "Locked"}
          </Button>
        )}

        {isPublished ? (
          <Button
            asChild
            className="q-button q-button-secondary rounded-none"
            variant="outline"
          >
            <Link href={routes.quizDetail(quiz.id)}>
              <Eye data-icon="inline-start" />
              Preview
            </Link>
          </Button>
        ) : (
          <Button
            className="q-button q-button-disabled rounded-none"
            disabled
            type="button"
          >
            <Eye data-icon="inline-start" />
            Preview
          </Button>
        )}
      </div>

      {isDraft || isScheduled ? (
        <div className="grid gap-2 border-2 border-[#EBE4D8] bg-[#FFFAF2] p-3">
          <label className="grid gap-2">
            <span className="q-mini text-[#211F20]">Exact release time</span>
            <Input
              className="q-input h-11"
              disabled={isPending}
              min={minPublishAt}
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <Button
              className="q-button q-button-secondary rounded-none"
              disabled={isPending}
              onClick={handleSchedulePublish}
              type="button"
              variant="outline"
            >
              <CalendarClock data-icon="inline-start" />
              {pendingAction === "schedule"
                ? "Saving..."
                : isScheduled
                ? "Update time"
                : "Schedule"}
            </Button>

            <Button
              className="q-button q-button-primary rounded-none border-[#006E5A] bg-[#006E5A]"
              disabled={isPending}
              onClick={handlePublishNow}
              type="button"
            >
              <Send data-icon="inline-start" />
              {pendingAction === "publish-now" ? "Publishing..." : "Publish now"}
            </Button>
          </div>
        </div>
      ) : null}

      {isPublished ? (
        <div className="border-2 border-[#DDECE8] bg-[#DDECE8] p-3">
          <p className="q-mini text-[#006E5A]">Published</p>
          <p className="mt-1 q-body text-[#211F20]">{quiz.publishAtLabel}</p>
        </div>
      ) : null}

      {!isArchived ? (
        <Button
          className="q-button q-button-secondary rounded-none"
          disabled={isPending}
          onClick={handleArchive}
          type="button"
          variant="outline"
        >
          <Archive data-icon="inline-start" />
          {pendingAction === "archive" ? "Archiving..." : "Archive"}
        </Button>
      ) : null}

      {actionError ? (
        <p className="q-mini text-[#FF3C38]">{actionError}</p>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: AdminQuizListItem["status"] }) {
  const classes: Record<AdminQuizListItem["status"], string> = {
    draft: "bg-[#EBE4D8] text-[#211F20]",
    scheduled: "bg-[#DDECE8] text-[#006E5A]",
    published: "bg-[#006E5A] text-[#FFFAF2]",
    archived: "bg-[#8F8F8F] text-[#FFFAF2]",
  };

  return (
    <Badge
      className={cn(
        "rounded-none border-0 px-2 py-1 text-[12px] capitalize leading-4",
        classes[status]
      )}
      variant="secondary"
    >
      {status}
    </Badge>
  );
}

function getPublishMetaText(quiz: AdminQuizListItem) {
  if (quiz.status === "draft") {
    return "Not scheduled";
  }

  if (quiz.status === "scheduled") {
    return `Publishes ${quiz.publishAtLabel}`;
  }

  if (quiz.status === "published") {
    return `Published ${quiz.publishAtLabel}`;
  }

  return quiz.publishAt ? `Published ${quiz.publishAtLabel}` : "Not scheduled";
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="grid min-h-[64px] grid-cols-[auto_1fr] items-center gap-x-2 border border-[#EBE4D8] bg-[#FFFDF8] px-3 py-2">
      <span className="row-span-2 text-[#006E5A]">{icon}</span>
      <span className="q-mini text-[#8F8F8F]">{label}</span>
      <span className="truncate text-[15px] font-semibold leading-5 text-[#211F20]">
        {value}
      </span>
    </div>
  );
}

function formatAttemptCount(value: number) {
  return `${value} ${value === 1 ? "attempt" : "attempts"}`;
}

async function publishQuizNow(quiz: AdminQuizListItem) {
  const body: QuizPublishPayload = {
    publish_date: new Date(Date.now() - 1000).toISOString(),
  };

  if (quiz.status === "scheduled") {
    return replaceScheduledQuiz(quiz, body);
  }

  return proxyFetchJson<QuizResponse>(`/quizzes/${quiz.id}/publish`, {
    method: "PATCH",
    body,
  });
}

async function scheduleQuizRelease(
  quiz: AdminQuizListItem,
  publishDate: string
) {
  const body: QuizPublishPayload = { publish_date: publishDate };

  if (quiz.status === "scheduled") {
    return replaceScheduledQuiz(quiz, body);
  }

  return proxyFetchJson<QuizResponse>(`/quizzes/${quiz.id}/publish`, {
    method: "PATCH",
    body,
  });
}

async function replaceScheduledQuiz(
  quiz: AdminQuizListItem,
  publishBody: QuizPublishPayload
) {
  const current = await proxyFetchJson<QuizFullResponse>(`/quizzes/${quiz.id}`);
  return replaceLockedQuiz(
    quiz.id,
    buildCreateQuizPayloadFromFullQuiz(current),
    publishBody
  );
}

function parseDatetimeLocalValue(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function toDatetimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join("T");
}
