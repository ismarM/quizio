"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, Suspense } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Grid2X2,
  List,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import type { QuizListItem } from "@/lib/types";
import { QuizCard } from "@/components/quizzes/QuizCard";
import { buildUpdatedSearchParams } from "@/lib/navigation/search-params";

const pageSize = 8;

type QuizBrowserProps = {
  quizzes: QuizListItem[];
};

type DurationFilter = "any" | "short" | "medium" | "long";
type CompletionFilter = "all" | "completed" | "uncompleted";
type SortFilter =
  | "newest"
  | "oldest"
  | "title-asc"
  | "duration-asc"
  | "duration-desc"
  | "questions-desc";

const durationValues: DurationFilter[] = ["any", "short", "medium", "long"];
const completionValues: CompletionFilter[] = [
  "all",
  "completed",
  "uncompleted",
];

const sortValues: SortFilter[] = [
  "newest",
  "oldest",
  "title-asc",
  "duration-asc",
  "duration-desc",
  "questions-desc",
];

function parsePage(value: string | null) {
  const page = Number.parseInt(value || "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function parseDurationFilter(value: string | null): DurationFilter {
  return durationValues.some((option) => option === value)
    ? (value as DurationFilter)
    : "any";
}

function parseCompletionFilter(value: string | null): CompletionFilter {
  return completionValues.some((option) => option === value)
    ? (value as CompletionFilter)
    : "all";
}

function parseSortFilter(value: string | null): SortFilter {
  return sortValues.some((option) => option === value)
    ? (value as SortFilter)
    : "newest";
}

function matchesDurationFilter(quiz: QuizListItem, duration: DurationFilter) {
  if (duration === "any") {
    return true;
  }

  if (duration === "short") {
    return quiz.timeLimitMinutes <= 10;
  }

  if (duration === "medium") {
    return quiz.timeLimitMinutes > 10 && quiz.timeLimitMinutes <= 20;
  }

  return quiz.timeLimitMinutes > 20;
}

export function QuizBrowser({ quizzes }: QuizBrowserProps) {
  return (
    <Suspense fallback={null}>
      <QuizBrowserInner quizzes={quizzes} />
    </Suspense>
  );
}

function QuizBrowserInner({ quizzes }: QuizBrowserProps) {
  const t = useTranslations("quizzes");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const categoryOptions = useMemo(() => {
    const unique = new Set(
      quizzes.map((quiz) => quiz.category).filter((item) => item.trim())
    );
    return ["All", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [quizzes]);

  const [query, setQuery] = useState(() => searchParams.get("query") || "");
  const [category, setCategory] = useState(() => {
    const initialCategory = searchParams.get("category") || "All";
    return categoryOptions.includes(initialCategory) ? initialCategory : "All";
  });
  const [duration, setDuration] = useState<DurationFilter>(() =>
    parseDurationFilter(searchParams.get("duration"))
  );
  const [completion, setCompletion] = useState<CompletionFilter>(() =>
    parseCompletionFilter(searchParams.get("completion"))
  );
  const [sortBy, setSortBy] = useState<SortFilter>(() =>
    parseSortFilter(searchParams.get("sort"))
  );
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [page, setPage] = useState(() => parsePage(searchParams.get("page")));
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    () => (searchParams.get("view") as "grid" | "list") || "grid"
  );

  const filteredQuizzes = useMemo(() => {
    const filtered = quizzes.filter((quiz) => {
      const search = query.toLowerCase();

      const matchesQuery =
        quiz.title.toLowerCase().includes(search) ||
        quiz.description.toLowerCase().includes(search) ||
        quiz.category.toLowerCase().includes(search);

      const matchesCategory = category === "All" || quiz.category === category;
      const matchesDuration = matchesDurationFilter(quiz, duration);
      const matchesCompletion =
        completion === "all" ||
        (completion === "completed" && quiz.isCompleted) ||
        (completion === "uncompleted" && !quiz.isCompleted);

      return (
        matchesQuery && matchesCategory && matchesDuration && matchesCompletion
      );
    });

    return filtered
      .map((quiz, index) => ({ quiz, index }))
      .sort((a, b) => {
        if (sortBy === "oldest") {
          return b.index - a.index;
        }

        if (sortBy === "title-asc") {
          return a.quiz.title.localeCompare(b.quiz.title);
        }

        if (sortBy === "duration-asc") {
          return a.quiz.timeLimitMinutes - b.quiz.timeLimitMinutes;
        }

        if (sortBy === "duration-desc") {
          return b.quiz.timeLimitMinutes - a.quiz.timeLimitMinutes;
        }

        if (sortBy === "questions-desc") {
          return b.quiz.questionCount - a.quiz.questionCount;
        }

        return a.index - b.index;
      })
      .map((item) => item.quiz);
  }, [quizzes, query, category, duration, completion, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredQuizzes.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const visibleQuizzes = filteredQuizzes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newSearch = buildUpdatedSearchParams(searchParams, [
        { name: "query", value: query },
        { defaultValue: "All", name: "category", value: category },
        { defaultValue: "any", name: "duration", value: duration },
        { defaultValue: "all", name: "completion", value: completion },
        { defaultValue: "newest", name: "sort", value: sortBy },
        { defaultValue: 1, name: "page", value: currentPage },
        { defaultValue: "grid", name: "view", value: viewMode },
      ]);

      if (newSearch !== searchParams.toString()) {
        router.replace(newSearch ? `${pathname}?${newSearch}` : pathname, {
          scroll: false,
        });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    query,
    category,
    duration,
    completion,
    sortBy,
    currentPage,
    viewMode,
    pathname,
    router,
    searchParams,
  ]);

  function setNextCategory(value: string) {
    setCategory(value);
    setPage(1);
  }

  function setNextQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function setNextDuration(value: string) {
    setDuration(parseDurationFilter(value));
    setPage(1);
  }

  function setNextCompletion(value: string) {
    setCompletion(parseCompletionFilter(value));
    setPage(1);
  }

  function setNextSort(value: string) {
    setSortBy(parseSortFilter(value));
    setPage(1);
  }

  function clearFilters() {
    setCategory("All");
    setDuration("any");
    setCompletion("all");
    setSortBy("newest");
    setQuery("");
    setPage(1);
  }

  const activeFilterCount = [
    query.trim().length > 0,
    category !== "All",
    duration !== "any",
    completion !== "all",
    sortBy !== "newest",
  ].filter(Boolean).length;

  const durationOptions: { value: DurationFilter; label: string }[] = [
    { value: "any", label: t("durationAny") },
    { value: "short", label: t("durationShort") },
    { value: "medium", label: t("durationMedium") },
    { value: "long", label: t("durationLong") },
  ];

  const sortOptions: { value: SortFilter; label: string }[] = [
    { value: "newest", label: t("filterNewest") },
    { value: "oldest", label: t("sortOldest") },
    { value: "title-asc", label: t("sortTitleAsc") },
    { value: "duration-asc", label: t("sortShortest") },
    { value: "duration-desc", label: t("sortLongest") },
    { value: "questions-desc", label: t("sortMostQuestions") },
  ];

  const completionOptions: { value: CompletionFilter; label: string }[] = [
    { value: "all", label: t("completionAll") },
    { value: "completed", label: t("completionCompleted") },
    { value: "uncompleted", label: t("completionUncompleted") },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--q-ink-muted)]" />
          <input
            className="q-input h-12 pl-12"
            placeholder={t("searchPlaceholder")}
            type="search"
            value={query}
            onChange={(event) => setNextQuery(event.target.value)}
          />
        </label>

        <button
          type="button"
          onClick={() => setFiltersOpen((value) => !value)}
          className="q-button q-button-secondary grid h-12 place-items-center px-5 text-center"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="pt-1">{t("filters")}</span>
            <span className="grid size-6 place-items-center bg-[var(--q-green)] pt-0 q-mini leading-none text-[var(--q-on-accent)]">
              {activeFilterCount}
            </span>
          </span>
        </button>
      </div>

      {filtersOpen ? (
        <div className="grid gap-4 border border-[var(--q-muted-strong)] bg-[var(--q-muted)] p-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:items-end">
          <FilterSelect
            label={t("filterCategory")}
            options={categoryOptions.map((item) => ({
              value: item,
              label: item === "All" ? t("filterAllCategories") : item,
            }))}
            value={category}
            onChange={setNextCategory}
          />
          <FilterSelect
            label={t("filterDuration")}
            options={durationOptions}
            value={duration}
            onChange={setNextDuration}
          />
          <FilterSelect
            label={t("filterCompletion")}
            options={completionOptions}
            value={completion}
            onChange={setNextCompletion}
          />
          <FilterSelect
            label={t("filterSort")}
            options={sortOptions}
            value={sortBy}
            onChange={setNextSort}
          />

          <button
            type="button"
            onClick={clearFilters}
            className="flex h-10 items-center justify-center gap-2 q-body font-medium text-[var(--q-ink)] hover:text-[var(--q-red)] md:justify-start"
          >
            <X className="h-4 w-4" />
            {t("clearAll")}
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="q-body">
          {t("showing")}{" "}
          <strong className="text-[var(--q-green)]">
            {visibleQuizzes.length}
          </strong>{" "}
          {t("of")}{" "}
          <strong className="text-[var(--q-green)]">
            {filteredQuizzes.length}
          </strong>{" "}
          {t("quizzesCount", { count: filteredQuizzes.length })}
        </p>

        <div className="hidden gap-1 md:flex">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            aria-label={t("gridView")}
            className={[
              "flex h-9 w-9 items-center justify-center border border-[var(--q-muted-strong)]",
              viewMode === "grid"
                ? "bg-[var(--q-green)] text-[var(--q-on-accent)]"
                : "bg-[var(--q-surface)] text-[var(--q-ink)] hover:border-[var(--q-border)]",
            ].join(" ")}
          >
            <Grid2X2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-label={t("listView")}
            className={[
              "flex h-9 w-9 items-center justify-center border border-[var(--q-muted-strong)]",
              viewMode === "list"
                ? "bg-[var(--q-green)] text-[var(--q-on-accent)]"
                : "bg-[var(--q-surface)] text-[var(--q-ink)] hover:border-[var(--q-border)]",
            ].join(" ")}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className={[
          "grid gap-4",
          viewMode === "grid"
            ? "md:grid-cols-3 xl:grid-cols-4"
            : "md:grid-cols-1",
        ].join(" ")}
      >
        {visibleQuizzes.length > 0 ? (
          visibleQuizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} viewMode={viewMode} />
          ))
        ) : (
          <div className="border-2 border-[var(--q-border)] bg-[var(--q-surface)] p-5 md:col-span-3 xl:col-span-4">
            <p className="font-display text-3xl leading-none text-[var(--q-ink)]">
              {t("noQuizzesFound")}
            </p>
            <p className="mt-2 q-body text-[var(--q-ink)]">
              {t("adjustFilters")}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 pt-4">
        <button
          type="button"
          className="q-button q-button-secondary px-3 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => setPage((value) => Math.max(1, value - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {Array.from({ length: totalPages }).map((_, index) => {
          const pageNumber = index + 1;

          return (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setPage(pageNumber)}
              className={[
                "q-button px-4",
                currentPage === pageNumber
                  ? "q-button-primary border-[var(--q-red)] bg-[var(--q-red)]"
                  : "q-button-secondary",
              ].join(" ")}
            >
              {pageNumber}
            </button>
          );
        })}

        <button
          type="button"
          className="q-button q-button-secondary px-3 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={currentPage === totalPages}
          onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 q-mini text-[var(--q-ink)]">
        <SlidersHorizontal className="h-4 w-4 text-[var(--q-green)]" />
        {label}
      </span>

      <select
        className="q-input h-10 appearance-none rounded-none border-2 border-[var(--q-border)] bg-[var(--q-surface)] pr-10 q-mini text-[var(--q-ink)] transition focus:border-[var(--q-green)]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
