"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Archive,
  Clock3,
  Eye,
  FilePlus2,
  ListChecks,
  Pencil,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import type { AdminQuizListItem } from "@/lib/admin-quiz-mappers";
import { routes } from "@/lib/routes";

const statuses = ["all", "draft", "published", "archived"] as const;

type StatusFilter = (typeof statuses)[number];

type AdminQuizBrowserProps = {
  quizzes: AdminQuizListItem[];
};

export function AdminQuizBrowser({ quizzes }: AdminQuizBrowserProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const search = query.toLowerCase();

      const matchesQuery =
        quiz.title.toLowerCase().includes(search) ||
        quiz.description.toLowerCase().includes(search) ||
        quiz.category.toLowerCase().includes(search);

      const matchesStatus = status === "all" || quiz.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [quizzes, query, status]);

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8F8F8F]" />
          <input
            className="q-input h-12 pl-12"
            placeholder="Search admin quizzes..."
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <Link
          href={routes.adminQuizNew}
          className="q-button q-button-primary h-12 border-[#FF3C38] bg-[#FF3C38]"
        >
          <FilePlus2 className="h-4 w-4" />
          Create quiz
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {statuses.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setStatus(item)}
            className={[
              "q-button shrink-0 capitalize",
              status === item
                ? "q-button-primary border-[#006E5A] bg-[#006E5A]"
                : "q-button-secondary",
            ].join(" ")}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between border-y-2 border-[#211F20] py-3">
        <p className="q-body">
          Showing{" "}
          <strong className="text-[#006E5A]">{filteredQuizzes.length}</strong>{" "}
          quizzes
        </p>

        <p className="q-mini text-[#8F8F8F]">
          Admin content management
        </p>
      </div>

      <div className="grid gap-4">
        {filteredQuizzes.map((quiz) => (
          <AdminQuizCard key={quiz.id} quiz={quiz} />
        ))}
      </div>
    </div>
  );
}

function AdminQuizCard({ quiz }: { quiz: AdminQuizListItem }) {
  return (
    <article className="grid gap-4 border-2 border-[#211F20] bg-[#FFFAF2] p-5 transition hover:shadow-[6px_6px_0_#EBE4D8] lg:grid-cols-[minmax(0,1fr)_260px]">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h2 className="font-display text-[34px] leading-none text-[#211F20]">
            {quiz.title}
          </h2>

          <StatusBadge status={quiz.status} />

          <span className="bg-[#DDECE8] px-2 py-1 text-[12px] leading-4 text-[#006E5A]">
            {quiz.category}
          </span>
        </div>

        <p className="max-w-3xl q-body text-[#211F20]">{quiz.description}</p>

        <div className="mt-4 flex flex-wrap gap-3 text-[14px] leading-5 text-[#211F20]">
          <MetaItem
            icon={<ListChecks className="h-4 w-4" />}
            text={`${quiz.questionCount} questions`}
          />
          <MetaItem
            icon={<Clock3 className="h-4 w-4" />}
            text={`${quiz.timeLimitMinutes} min`}
          />
          <MetaItem
            icon={<Users className="h-4 w-4" />}
            text={`${quiz.attempts} attempts`}
          />
          <MetaItem
            icon={<Archive className="h-4 w-4" />}
            text={`Created ${quiz.createdAt}`}
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3 lg:w-[240px] lg:grid-cols-1">
        <Link
          href={routes.adminQuizDetail(quiz.id)}
          className="q-button q-button-primary border-[#211F20] bg-[#211F20]"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Link>

        <Link
          href={routes.quizDetail(quiz.id)}
          className="q-button q-button-secondary"
        >
          <Eye className="h-4 w-4" />
          Preview
        </Link>

        <button
          type="button"
          className={[
            "q-button",
            quiz.status === "published"
              ? "q-button-disabled"
              : "q-button-secondary",
          ].join(" ")}
        >
          <ShieldCheck className="h-4 w-4" />
          {quiz.status === "published" ? "Locked" : "Publish"}
        </button>

        {quiz.status === "published" ? (
          <button type="button" className="q-button q-button-secondary">
            <Archive className="h-4 w-4" />
            Archive
          </button>
        ) : null}
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: AdminQuizListItem["status"] }) {
  const classes = {
    draft: "bg-[#EBE4D8] text-[#211F20]",
    published: "bg-[#006E5A] text-[#FFFAF2]",
    archived: "bg-[#8F8F8F] text-[#FFFAF2]",
  };

  return (
    <span className={`px-2 py-1 text-[12px] leading-4 ${classes[status]}`}>
      {status}
    </span>
  );
}

function MetaItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-[#006E5A]">{icon}</span>
      {text}
    </span>
  );
}