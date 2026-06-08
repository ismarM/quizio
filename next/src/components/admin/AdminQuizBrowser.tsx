"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo, useState, Suspense, type ReactNode } from "react";
import {
  Archive,
  CalendarClock,
  ChevronRight,
  Clock3,
  GripVertical,
  ListChecks,
  Lock,
  Pencil,
  Search,
  Send,
  Users,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminQuizListItem } from "@/components/admin/data/quiz-mappers";
import { cn } from "@/lib/utils";
import { proxyFetchJson } from "@/lib/api/proxy-client";
import { routes } from "@/lib/navigation/routes";
import type { QuizResponse } from "@/lib/types";

type QuizPublishPayload = {
  publish_date?: string;
  unpublish?: boolean;
};

type StatusFilter = "all" | AdminQuizListItem["status"];

const activeStatuses: StatusFilter[] = [
  "all",
  "draft",
  "scheduled",
  "published",
];
const archivedStatuses: StatusFilter[] = ["all", "archived"];

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
  const t = useTranslations("admin");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState(() => searchParams.get("query") || "");
  const [status, setStatus] = useState<StatusFilter>(
    () => (searchParams.get("status") as StatusFilter) || "all"
  );
  const [category, setCategory] = useState(
    () => searchParams.get("category") || "all"
  );
  const [activeActionQuizId, setActiveActionQuizId] = useState<number | null>(
    null
  );

  const statusOptions = archivedView ? archivedStatuses : activeStatuses;
  const categoryOptions = useMemo(() => {
    const unique = new Set(quizzes.map((quiz) => quiz.category));
    return ["all", ...Array.from(unique).sort()];
  }, [quizzes]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setQuery(searchParams.get("query") || "");
      setStatus((searchParams.get("status") as StatusFilter) || "all");
      setCategory(searchParams.get("category") || "all");
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [searchParams]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(Array.from(searchParams.entries()));

      if (query) params.set("query", query);
      else params.delete("query");

      if (status !== "all") params.set("status", status);
      else params.delete("status");

      if (category !== "all") params.set("category", category);
      else params.delete("category");

      const newSearch = params.toString();
      if (newSearch !== searchParams.toString()) {
        router.replace(`${pathname}?${newSearch}`, { scroll: false });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [category, query, status, pathname, router, searchParams]);

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const search = query.toLowerCase();

      const matchesQuery =
        quiz.title.toLowerCase().includes(search) ||
        quiz.description.toLowerCase().includes(search) ||
        quiz.category.toLowerCase().includes(search) ||
        quiz.publishAtLabel.toLowerCase().includes(search);

      const matchesStatus = status === "all" || quiz.status === status;
      const matchesCategory = category === "all" || quiz.category === category;

      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [category, quizzes, query, status]);
  const visibleRange =
    filteredQuizzes.length === 0 ? "0" : `1-${filteredQuizzes.length}`;
  const statusLabels: Record<StatusFilter, string> = {
    all: t("all"),
    draft: t("draft"),
    scheduled: t("scheduled"),
    published: t("published"),
    archived: t("archived"),
  };

  return (
    <section className="relative overflow-visible border-2 border-[#211F20] bg-[#FFFDF8] shadow-[6px_6px_0_#EBE4D8]">
      <div className="p-4 lg:p-6">
        <h2 className="font-display text-[28px] leading-none text-[#211F20] lg:text-[34px]">
          {archivedView ? t("archivedQuizzes") : t("allQuizzes")}
        </h2>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_170px_170px_auto] lg:items-center">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F8F8F]" />
            <Input
              className="h-10 rounded-none border-2 border-[#211F20] bg-[#FFFAF2] pl-11 text-[13px] shadow-none transition placeholder:text-[#8F8F8F] focus-visible:border-[#006E5A] focus-visible:ring-0"
              placeholder={t("searchPlaceholder")}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <SelectFilter
            label={t("status")}
            value={status}
            onChange={(value) => setStatus(value as StatusFilter)}
          >
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? t("allStatuses") : statusLabels[item]}
              </option>
            ))}
          </SelectFilter>

          <SelectFilter
            label={t("category")}
            value={category}
            onChange={setCategory}
          >
            {categoryOptions.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? t("allCategories") : item}
              </option>
            ))}
          </SelectFilter>

          {archivedView ? (
            <Button
              asChild
              className="q-button q-button-secondary h-10 rounded-none border-2 border-[#211F20] bg-[#FFFAF2] px-4 text-[15px] transition hover:-translate-y-0.5 hover:bg-[#EBE4D8]"
              variant="outline"
            >
              <Link href={routes.admin}>
                <ListChecks className="h-4 w-4" />
                {t("allQuizzes")}
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              className="q-button q-button-secondary h-10 rounded-none border-2 border-[#211F20] bg-[#FFFAF2] px-4 text-[15px] transition hover:-translate-y-0.5 hover:bg-[#EBE4D8]"
              variant="outline"
            >
              <Link href={routes.adminArchivedQuizzes}>
                <Lock className="h-4 w-4" />
                {t("archivedLocked")}
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="hidden border-y-2 border-[#211F20] px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#8F8F8F] lg:grid lg:grid-cols-[34px_minmax(220px,1.35fr)_minmax(210px,250px)_minmax(130px,150px)_minmax(220px,250px)] lg:items-center">
        <span className="col-start-2 px-6">{t("quiz")}</span>
        <span className="text-center">{t("details")}</span>
        <span className="text-center">{t("status")}</span>
        <span className="text-center">{t("actions")}</span>
      </div>

      <div className="grid gap-2 p-4 lg:gap-3 lg:p-6 lg:pt-5">
        {filteredQuizzes.length > 0 ? (
          filteredQuizzes.map((quiz) => (
            <AdminQuizCard
              actionMenuActive={activeActionQuizId !== null}
              key={quiz.id}
              onActionMenuToggle={(open) =>
                setActiveActionQuizId(open ? quiz.id : null)
              }
              quiz={quiz}
            />
          ))
        ) : (
          <div className="border-2 border-[#211F20] bg-[#FFFAF2] p-5">
            <p className="font-display text-3xl leading-none text-[#211F20]">
              {t("noQuizzesFound")}
            </p>
            <p className="mt-2 text-[14px] leading-6 text-[#211F20]">
              {t("adjustFilters")}
            </p>
          </div>
        )}
      </div>

      <div className="hidden border-t-2 border-[#211F20] px-6 py-4 text-[13px] text-[#211F20] lg:block">
        <span>
          {t("showing", {
            count: filteredQuizzes.length,
            range: visibleRange,
          })}
        </span>
      </div>
    </section>
  );
}

function SelectFilter({
  children,
  label,
  value,
  onChange,
}: {
  children: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <select
        className="h-10 w-full appearance-none rounded-none border-2 border-[#211F20] bg-[#FFFAF2] px-4 pr-9 text-[13px] font-semibold text-[#211F20] outline-none transition focus:border-[#006E5A]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
      <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-[#211F20]" />
    </label>
  );
}

function AdminQuizCard({
  actionMenuActive,
  onActionMenuToggle,
  quiz,
}: {
  actionMenuActive: boolean;
  onActionMenuToggle: (open: boolean) => void;
  quiz: AdminQuizListItem;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const statusTone = getStatusTone(quiz.status);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const previewHref =
    quiz.status === "published"
      ? routes.quizDetail(quiz.id)
      : routes.adminQuizDetail(quiz.id);

  function openPreview() {
    router.push(previewHref);
  }

  return (
    <article
      className={cn(
        "relative overflow-visible border-2 border-[#D7D0C4] bg-[#FFFAF2] transition duration-200",
        actionMenuActive
          ? "border-[#D7D0C4]"
          : "hover:-translate-y-0.5 hover:border-[#211F20] hover:shadow-[4px_4px_0_#EBE4D8]",
        isActionMenuOpen
          ? "z-[200] shadow-[4px_4px_0_#EBE4D8]"
          : actionMenuActive
            ? "z-0"
            : "z-0 hover:z-20"
      )}
      onClick={openPreview}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPreview();
        }
      }}
      aria-label={`${t("preview")} ${quiz.title}`}
      role="link"
      tabIndex={0}
    >
      <div className="hidden min-h-[118px] grid-cols-[34px_minmax(220px,1.35fr)_minmax(210px,250px)_minmax(130px,150px)_minmax(220px,250px)] overflow-visible lg:grid">
        <div
          className={[
            "flex items-center justify-center text-[#FFFAF2]",
            statusTone.side,
          ].join(" ")}
        >
          <GripVertical className="h-5 w-5" strokeWidth={1.8} />
        </div>

        <div className="min-w-0 px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-[30px] leading-none text-[#211F20]">
              {quiz.title}
            </h3>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={quiz.status} />
            <CategoryBadge category={quiz.category} />
          </div>

          <p className="mt-3 line-clamp-2 text-[14px] leading-5 text-[#211F20]">
            {quiz.description}
          </p>
        </div>

        <div className="grid content-center gap-2 border-l-2 border-[#EBE4D8] px-6 py-4">
          <DetailLine
            icon={<ListChecks className="h-4 w-4" />}
            text={t("questionCount", { count: quiz.questionCount })}
          />
          <DetailLine
            icon={<Clock3 className="h-4 w-4" />}
            text={`${quiz.timeLimitMinutes} min`}
          />
          <DetailLine
            icon={<CalendarClock className="h-4 w-4" />}
            text={getPublishMetaText(quiz, {
              notScheduled: t("notScheduled"),
              publishedAt: (date) => t("publishedAt", { date }),
              publishes: (date) => t("publishes", { date }),
            })}
          />
        </div>

        <div className="flex items-center justify-center border-l-2 border-[#EBE4D8] px-6">
          <StatusMarker status={quiz.status} />
        </div>

        <AdminQuizActions
          quiz={quiz}
          onMenuToggle={(open) => {
            setIsActionMenuOpen(open);
            onActionMenuToggle(open);
          }}
        />
      </div>

      <div className="grid grid-cols-[24px_minmax(0,1fr)_40px] lg:hidden">
        <div
          className={[
            "flex items-center justify-center text-[#FFFAF2]",
            statusTone.side,
          ].join(" ")}
        >
          <GripVertical className="h-4 w-4" strokeWidth={1.8} />
        </div>

        <div className="min-w-0 px-4 py-3">
          <h3 className="font-display text-[22px] leading-none text-[#211F20]">
            {quiz.title}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={quiz.status} />
            <CategoryBadge category={quiz.category} />
          </div>

          <p className="mt-2 text-[12px] leading-4 text-[#211F20]">
            {t("questionCount", { count: quiz.questionCount })} ·{" "}
            {quiz.timeLimitMinutes} min
          </p>
        </div>

        <Link
          className="flex items-center justify-center border-l-2 border-[#EBE4D8] transition hover:bg-[#EBE4D8]"
          href={previewHref}
          onClick={(event) => event.stopPropagation()}
        >
          {quiz.status === "published" ? (
            <span className="h-2.5 w-2.5 rounded-full bg-[#12A05C]" />
          ) : quiz.status === "archived" ? (
            <Lock className="h-4 w-4 text-[#211F20]" />
          ) : (
            <ChevronRight className="h-5 w-5 text-[#211F20]" />
          )}
        </Link>
      </div>
    </article>
  );
}

type PendingAction = "publish-now" | "schedule" | "archive" | "unpublish";

function AdminQuizActions({
  quiz,
  onMenuToggle,
}: {
  quiz: AdminQuizListItem;
  onMenuToggle?: (open: boolean) => void;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [scheduledAt, setScheduledAt] = useState(() =>
    quiz.publishAt ? toDatetimeLocalValue(new Date(quiz.publishAt)) : ""
  );
  const [minPublishAt] = useState(() => toDatetimeLocalValue(new Date()));
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const isDraft = quiz.status === "draft";
  const isScheduled = quiz.status === "scheduled";
  const isPublished = quiz.status === "published";
  const isArchived = quiz.status === "archived";
  const canEdit = isDraft || isScheduled;
  const isPending = pendingAction !== null;

  function setActionPanelOpen(open: boolean) {
    setMenuOpen(open);
    onMenuToggle?.(open);
  }

  function closeActionPanel() {
    setActionPanelOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        onMenuToggle?.(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen, onMenuToggle]);

  async function runAction(
    action: PendingAction,
    request: () => Promise<unknown>
  ) {
    setActionError(null);
    setPendingAction(action);

    try {
      await request();
      closeActionPanel();
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("actionFailed");
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
      setActionError(t("choosePublishTime"));
      return;
    }

    if (publishDate.getTime() <= Date.now()) {
      setActionError(t("chooseFutureTime"));
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

  function handleUnpublish() {
    void runAction("unpublish", () => unpublishQuiz(quiz));
  }

  return (
    <div
      className="relative flex items-center justify-center gap-3 border-l-2 border-[#EBE4D8] px-4"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <button
        aria-expanded={menuOpen}
        aria-haspopup="dialog"
        aria-label={isPublished ? t("unpublish") : t("publish")}
        className="flex h-11 w-11 items-center justify-center border-2 border-[#D7D0C4] bg-[#FFFAF2] text-[#211F20] transition hover:-translate-y-0.5 hover:border-[#211F20] hover:bg-[#EBE4D8]"
        onClick={() => setActionPanelOpen(true)}
        title={isPublished ? t("unpublish") : t("publish")}
        type="button"
      >
        <Send className="h-5 w-5" />
      </button>

      <ActionLink href={routes.adminQuizResults(quiz.id)} label={t("results")}>
        <Users className="h-5 w-5" />
      </ActionLink>

      {canEdit ? (
        <ActionLink href={routes.adminQuizDetail(quiz.id)} label={t("edit")}>
          <Pencil className="h-5 w-5" />
        </ActionLink>
      ) : (
        <ActionButton
          disabled
          label={isArchived ? t("archived") : t("locked")}
        >
          <Pencil className="h-5 w-5" />
        </ActionButton>
      )}

      {!isArchived ? (
        <button
          aria-label={t("archive")}
          className="flex h-11 w-11 items-center justify-center border-2 border-[#D7D0C4] bg-[#FFFAF2] text-[#211F20] transition hover:-translate-y-0.5 hover:border-[#FF3C38] hover:bg-[#EBE4D8] hover:text-[#FF3C38] disabled:cursor-not-allowed disabled:opacity-55"
          disabled={isPending}
          onClick={handleArchive}
          title={t("archive")}
          type="button"
        >
          <Archive className="h-5 w-5" />
        </button>
      ) : (
        <ActionButton disabled label={t("archived")}>
          <Archive className="h-5 w-5" />
        </ActionButton>
      )}

      {menuOpen ? (
        <div className="fixed inset-0 z-[500] flex items-end justify-center p-4 sm:items-center">
          <button
            aria-label="Close quiz actions"
            className="absolute inset-0 bg-[#211F20]/35"
            onClick={closeActionPanel}
            type="button"
          />

          <div
            aria-labelledby={`quiz-actions-${quiz.id}`}
            aria-modal="true"
            className="relative z-10 grid w-full max-w-[360px] gap-3 border-2 border-[#211F20] bg-[#FFFDF8] p-4 shadow-[8px_8px_0_#211F20]"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-3 border-b-2 border-[#EBE4D8] pb-3">
              <div className="min-w-0">
                <p
                  className="font-display text-2xl leading-none text-[#211F20]"
                  id={`quiz-actions-${quiz.id}`}
                >
                  {quiz.title}
                </p>
                <p className="mt-1 q-mini text-[#8F8F8F]">
                  {getStatusLabel(quiz.status, t)}
                </p>
              </div>

              <button
                aria-label="Close quiz actions"
                className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-[#D7D0C4] bg-[#FFFAF2] text-[#211F20] transition hover:border-[#211F20] hover:bg-[#EBE4D8]"
                onClick={closeActionPanel}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3">
              {isDraft || isScheduled ? (
                <>
                  <label className="grid gap-2">
                    <span className="q-mini text-[#211F20]">
                      {t("exactReleaseTime")}
                    </span>
                    <Input
                      className="h-10 rounded-none border-2 border-[#211F20] bg-[#FFFAF2] text-[13px] shadow-none focus-visible:border-[#006E5A] focus-visible:ring-0"
                      disabled={isPending}
                      min={minPublishAt}
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(event) => setScheduledAt(event.target.value)}
                    />
                  </label>

                  <Button
                    className="q-button q-button-secondary h-10 rounded-none border-2 border-[#211F20] bg-[#FFFAF2] text-[15px] transition hover:-translate-y-0.5 hover:bg-[#EBE4D8]"
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
                    className="q-button q-button-primary h-10 rounded-none border-[#006E5A] bg-[#006E5A] text-[15px] transition hover:-translate-y-0.5 hover:bg-[#005647]"
                    disabled={isPending}
                    onClick={handlePublishNow}
                    type="button"
                  >
                    <Send className="h-4 w-4" />
                    {pendingAction === "publish-now"
                      ? t("publishing")
                      : t("publishNow")}
                  </Button>
                </>
              ) : isPublished ? (
                <Button
                  className="q-button q-button-secondary h-10 rounded-none border-2 border-[#211F20] bg-[#FFFAF2] text-[15px] transition hover:-translate-y-0.5 hover:bg-[#EBE4D8]"
                  disabled={isPending}
                  onClick={handleUnpublish}
                  type="button"
                  variant="outline"
                >
                  <Lock className="h-4 w-4" />
                  {pendingAction === "unpublish"
                    ? t("saving")
                    : t("unpublishToDraft")}
                </Button>
              ) : (
                <div className="border-2 border-[#D7D0C4] bg-[#EBE4D8] p-3">
                  <p className="q-mini text-[#006E5A]">
                    {isPublished ? t("published") : t("locked")}
                  </p>
                  <p className="mt-1 text-[13px] leading-5 text-[#211F20]">
                    {quiz.publishAtLabel}
                  </p>
                </div>
              )}

              {actionError ? (
                <p className="q-mini text-[#FF3C38]">{actionError}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ActionLink({
  children,
  href,
  label,
}: {
  children: ReactNode;
  href: string;
  label: string;
}) {
  return (
    <Link
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center border-2 border-[#D7D0C4] bg-[#FFFAF2] text-[#211F20] transition duration-200 hover:-translate-y-0.5 hover:border-[#211F20] hover:bg-[#EBE4D8]"
      href={href}
      title={label}
    >
      {children}
    </Link>
  );
}

function ActionButton({
  children,
  disabled,
  label,
}: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center border-2 border-[#D7D0C4] bg-[#FFFAF2] text-[#8F8F8F] disabled:cursor-not-allowed disabled:opacity-55"
      disabled={disabled}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: AdminQuizListItem["status"] }) {
  const t = useTranslations("admin");
  const classes: Record<AdminQuizListItem["status"], string> = {
    draft: "bg-[#EBE4D8] text-[#211F20]",
    scheduled: "bg-[#EFE4CE] text-[#996A13]",
    published: "bg-[#006E5A] text-[#FFFAF2]",
    archived: "bg-[#EBE4D8] text-[#006E5A]",
  };

  return (
    <Badge
      className={cn(
        "rounded-none border-0 px-2 py-1 text-[12px] capitalize leading-4",
        classes[status]
      )}
      variant="secondary"
    >
      {getStatusLabel(status, t)}
    </Badge>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <Badge
      className="rounded-none border-0 bg-[#DDECE8] px-2 py-1 text-[11px] leading-4 text-[#006E5A]"
      variant="secondary"
    >
      {category}
    </Badge>
  );
}

function DetailLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="grid grid-cols-[18px_1fr] items-center gap-3 text-[14px] leading-5 text-[#211F20]">
      <span className="text-[#5F5B55]">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function StatusMarker({ status }: { status: AdminQuizListItem["status"] }) {
  const t = useTranslations("admin");
  const tone = getStatusTone(status);

  return (
    <div className="flex items-center gap-3">
      {status === "archived" ? (
        <Lock className="h-4 w-4 text-[#006E5A]" />
      ) : (
        <span className={["h-2.5 w-2.5 rounded-full", tone.dot].join(" ")} />
      )}
      <span className={["q-mini", tone.text].join(" ")}>
        {status === "archived" ? t("locked") : getStatusLabel(status, t)}
      </span>
    </div>
  );
}

function getStatusTone(status: AdminQuizListItem["status"]) {
  const tones = {
    draft: {
      side: "bg-[#9B9994]",
      dot: "bg-[#BDB6AA]",
      text: "text-[#8F8F8F]",
    },
    scheduled: {
      side: "bg-[#A06900]",
      dot: "bg-[#A06900]",
      text: "text-[#A06900]",
    },
    published: {
      side: "bg-[#006E5A]",
      dot: "bg-[#12A05C]",
      text: "text-[#006E5A]",
    },
    archived: {
      side: "bg-[#6F6758]",
      dot: "bg-[#006E5A]",
      text: "text-[#006E5A]",
    },
  } satisfies Record<
    AdminQuizListItem["status"],
    { side: string; dot: string; text: string }
  >;

  return tones[status];
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

function getPublishMetaText(
  quiz: AdminQuizListItem,
  labels: {
    notScheduled: string;
    publishedAt: (date: string) => string;
    publishes: (date: string) => string;
  }
) {
  if (quiz.status === "draft") {
    return labels.notScheduled;
  }

  if (quiz.status === "scheduled") {
    return labels.publishes(quiz.publishAtLabel);
  }

  if (quiz.status === "published") {
    return labels.publishedAt(quiz.publishAtLabel);
  }

  return quiz.publishAt
    ? labels.publishedAt(quiz.publishAtLabel)
    : labels.notScheduled;
}

async function publishQuizNow(quiz: AdminQuizListItem) {
  const body: QuizPublishPayload = {
    publish_date: new Date(Date.now() - 1000).toISOString(),
  };

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

  return proxyFetchJson<QuizResponse>(`/quizzes/${quiz.id}/publish`, {
    method: "PATCH",
    body,
  });
}

async function unpublishQuiz(quiz: AdminQuizListItem) {
  const body: QuizPublishPayload = { unpublish: true };

  return proxyFetchJson<QuizResponse>(`/quizzes/${quiz.id}/publish`, {
    method: "PATCH",
    body,
  });
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
