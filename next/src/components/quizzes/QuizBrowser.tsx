"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Grid2X2,
  List,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import type { QuizListItem } from "@/lib/mock-data";
import { QuizCard } from "@/components/quizzes/QuizCard";

const categories = [
  "All",
  "Science",
  "Geography",
  "History",
  "Math",
  "Technology",
  "Literature",
  "Arts",
];

const pageSize = 8;

type QuizBrowserProps = {
  quizzes: QuizListItem[];
};

export function QuizBrowser({ quizzes }: QuizBrowserProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const search = query.toLowerCase();

      const matchesQuery =
        quiz.title.toLowerCase().includes(search) ||
        quiz.description.toLowerCase().includes(search) ||
        quiz.category.toLowerCase().includes(search);

      const matchesCategory = category === "All" || quiz.category === category;

      return matchesQuery && matchesCategory;
    });
  }, [quizzes, query, category]);

  const totalPages = Math.max(1, Math.ceil(filteredQuizzes.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const visibleQuizzes = filteredQuizzes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function setNextCategory(value: string) {
    setCategory(value);
    setPage(1);
  }

  function setNextQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8F8F8F]" />
          <input
            className="q-input h-12 pl-12"
            placeholder="Search quizzes, topics or keywords..."
            type="search"
            value={query}
            onChange={(event) => setNextQuery(event.target.value)}
          />
        </label>

        <button
          type="button"
          onClick={() => setFiltersOpen((value) => !value)}
          className="q-button q-button-secondary h-12 gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          <span className="flex h-6 w-6 items-center justify-center bg-[#006E5A] q-mini text-[#FFFAF2]">
            2
          </span>
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setNextCategory(item)}
            className={[
              "q-button shrink-0",
              category === item
                ? "q-button-primary border-[#FF3C38] bg-[#FF3C38]"
                : "q-button-secondary bg-[#FFFAF2]",
            ].join(" ")}
          >
            {item}
          </button>
        ))}

        <button className="q-button q-button-secondary shrink-0 gap-1">
          More
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {filtersOpen ? (
        <div className="grid gap-4 border border-[#D7D0C4] bg-[#F4EFE6] p-4 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]">
          <FilterSelect label="Category" value="All categories" />
          <FilterSelect label="Difficulty" value="Any" />
          <FilterSelect label="Duration" value="Any" />
          <FilterSelect label="# Questions" value="Any" />
          <FilterSelect label="Sort by" value="Newest" />

          <button
            type="button"
            onClick={() => {
              setCategory("All");
              setQuery("");
              setPage(1);
            }}
            className="flex items-end gap-2 q-mini text-[#211F20] hover:text-[#FF3C38]"
          >
            <X className="h-4 w-4" />
            Clear all
          </button>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <p className="q-body">
          Showing <strong className="text-[#006E5A]">{visibleQuizzes.length}</strong>{" "}
          of <strong className="text-[#006E5A]">{filteredQuizzes.length}</strong>{" "}
          quizzes
        </p>

        <div className="hidden gap-1 md:flex">
            <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                className={[
                "flex h-9 w-9 items-center justify-center border border-[#D7D0C4]",
                viewMode === "grid"
                    ? "bg-[#006E5A] text-[#FFFAF2]"
                    : "bg-[#FFFAF2] text-[#211F20] hover:border-[#211F20]",
                ].join(" ")}
            >
                <Grid2X2 className="h-4 w-4" />
            </button>

            <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                className={[
                "flex h-9 w-9 items-center justify-center border border-[#D7D0C4]",
                viewMode === "list"
                    ? "bg-[#006E5A] text-[#FFFAF2]"
                    : "bg-[#FFFAF2] text-[#211F20] hover:border-[#211F20]",
                ].join(" ")}
            >
                <List className="h-4 w-4" />
            </button>
        </div>
      </div>

    <div
        className={[
            "grid gap-4",
            viewMode === "grid" ? "md:grid-cols-3 xl:md:grid-cols-4" : "md:grid-cols-1",
        ].join(" ")}
        >
        {visibleQuizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} viewMode={viewMode} />
        ))}
    </div>

      <div className="flex items-center justify-center gap-2 pt-4">
        <button
          type="button"
          className="q-button q-button-secondary px-3"
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
                  ? "q-button-primary border-[#FF3C38] bg-[#FF3C38]"
                  : "q-button-secondary",
              ].join(" ")}
            >
              {pageNumber}
            </button>
          );
        })}

        <button
          type="button"
          className="q-button q-button-secondary px-3"
          disabled={currentPage === totalPages}
          onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function FilterSelect({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 q-mini text-[#211F20]">
        <SlidersHorizontal className="h-4 w-4 text-[#006E5A]" />
        {label}
      </span>

      <select className="q-input h-10 bg-[#FFFAF2] q-mini">
        <option>{value}</option>
      </select>
    </label>
  );
}