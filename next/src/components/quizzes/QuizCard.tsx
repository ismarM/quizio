import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  FlaskConical,
  Globe2,
  Landmark,
  Monitor,
  Palette,
  Rocket,
  CalendarDays,
  Clock3,
  ListChecks,
  Users,
} from "lucide-react";

import type { QuizListItem } from "@/lib/mock-data";
import { routes } from "@/lib/routes";

type QuizCardProps = {
    quiz: QuizListItem;
    viewMode?: "grid" | "list";
};

const categoryIconMap = {
  Science: FlaskConical,
  Geography: Globe2,
  History: Landmark,
  Math: Calculator,
  Technology: Monitor,
  Literature: BookOpen,
  Arts: Palette,
  Space: Rocket,
};

const categoryColorMap = {
  Science: "#006E5A",
  Geography: "#006E5A",
  History: "#EBE4D8",
  Math: "#211F20",
  Technology: "#211F20",
  Literature: "#EBE4D8",
  Arts: "#FF3C38",
  Space: "#FF3C38",
};

export function QuizCard({ quiz, viewMode="grid" }: QuizCardProps) {
  const Icon =
    categoryIconMap[quiz.category as keyof typeof categoryIconMap] ??
    ListChecks;

  const iconColor =
    categoryColorMap[quiz.category as keyof typeof categoryColorMap] ??
    "#006E5A";

  return (
    <Link
      href={routes.quizDetail(quiz.id)}
      className={[
        "group border-2 border-[#D7D0C4] bg-[#FFFAF2] p-3 transition hover:-translate-y-1 hover:border-[#211F20] hover:shadow-[6px_6px_0_#EBE4D8]",
        viewMode === "grid"
          ? "grid grid-cols-[84px_1fr_auto] gap-4 md:grid-cols-1 md:gap-3"
          : "grid grid-cols-[84px_1fr_auto] gap-4 md:grid-cols-[96px_1fr_auto]",
      ].join(" ")}
    >
      <div
        className={[
            "flex h-20 w-20 items-center justify-center border border-[#D7D0C4] bg-[#EBE4D8]",
            viewMode === "grid" ? "md:h-28 md:w-full" : "md:h-24 md:w-24",
        ].join(" ")}
        >
        <Icon
          className="h-10 w-10 md:h-12 md:w-12"
          style={{ color: iconColor }}
          strokeWidth={1.8}
        />
      </div>

      <div className="min-w-0">
        <h2 className="font-display text-[28px] leading-none text-[#211F20] md:text-[30px]">
          {quiz.title}
        </h2>

        <span className="mt-2 inline-flex bg-[#DDECE8] px-2 py-1 text-[12px] leading-4 text-[#006E5A]">
          {quiz.category}
        </span>

        <p className="mt-3 line-clamp-2 text-[14px] leading-5 text-[#211F20] md:min-h-[40px]">
          {quiz.description}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[14px] leading-5 text-[#211F20] md:grid-cols-4">
          <span className="inline-flex items-center gap-1">
            <ListChecks className="h-4 w-4 text-[#006E5A]" />
            {quiz.questionCount} qs
          </span>

          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-4 w-4 text-[#006E5A]" />
            {quiz.timeLimitMinutes} min
          </span>

          <span className="inline-flex items-center gap-1">
            <Users className="h-4 w-4 text-[#006E5A]" />
            {quiz.plays}
          </span>

          <span className="hidden items-center gap-1 md:inline-flex">
            <CalendarDays className="h-4 w-4 text-[#006E5A]" />
            {quiz.opensAt}
          </span>
        </div>
      </div>

      <div className="flex items-center md:justify-end">
        <span className="flex h-9 w-9 items-center justify-center border-2 border-[#211F20] bg-[#FFFAF2] group-hover:bg-[#FF3C38] group-hover:text-[#FFFAF2]">
          <ArrowRight className="h-5 w-5" />
        </span>
      </div>
    </Link>
  );
}