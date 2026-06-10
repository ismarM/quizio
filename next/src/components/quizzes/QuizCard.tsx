import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  FlaskConical,
  Globe2,
  Landmark,
  Monitor,
  Palette,
  Rocket,
  CalendarDays,
  Clock3,
  ListChecks,
} from "lucide-react";

import type { QuizListItem } from "@/lib/types";
import { routes } from "@/lib/navigation/routes";
import { isImageUrl } from "@/lib/uploads/images";

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

export function QuizCard({ quiz, viewMode = "grid" }: QuizCardProps) {
  const t = useTranslations("quizzes");
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
          : "grid grid-cols-[84px_1fr_auto] gap-4 md:grid-cols-[96px_minmax(0,1fr)_auto]",
      ].join(" ")}
    >
      {isImageUrl(quiz.image) ? (
        <div
          aria-label={`${quiz.title} thumbnail`}
          className={[
            "h-20 w-20 border border-[#D7D0C4] bg-[#EBE4D8] bg-cover bg-center",
            viewMode === "grid" ? "md:h-28 md:w-full" : "md:h-24 md:w-24",
          ].join(" ")}
          role="img"
          style={{ backgroundImage: `url("${quiz.image}")` }}
        />
      ) : (
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
      )}

      <div className="min-w-0">
        <h2 className="font-display text-[28px] leading-none text-[#211F20] md:text-[30px]">
          {quiz.title}
        </h2>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex bg-[#DDECE8] px-2 py-1 text-[12px] leading-4 text-[#006E5A]">
            {quiz.category}
          </span>
          {quiz.isCompleted ? (
            <span className="inline-flex items-center gap-1 bg-[#006E5A] px-2 py-1 text-[12px] leading-4 text-[#FFFAF2]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              COMPLETED
            </span>
          ) : null}
          {quiz.hasOpenAttempt ? (
            <span className="inline-flex items-center gap-1 border border-[#FF3C38] bg-[#FFFDF8] px-2 py-1 text-[12px] leading-4 text-[#FF3C38]">
              <Clock3 className="h-3.5 w-3.5" />
              IN PROGRESS
            </span>
          ) : null}
        </div>

        <p className="mt-3 line-clamp-2 text-[14px] leading-5 text-[#211F20] md:min-h-[40px]">
          {quiz.description}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 text-[#211F20]">
          <QuizMetaItem
            icon={<ListChecks className="h-4 w-4" />}
            label={t("questions")}
            value={`${quiz.questionCount}`}
          />
          <QuizMetaItem
            icon={<Clock3 className="h-4 w-4" />}
            label={t("time")}
            value={`${quiz.timeLimitMinutes} min`}
          />
          <QuizMetaItem
            className="hidden md:grid md:col-span-2"
            icon={<CalendarDays className="h-4 w-4" />}
            label={t("opens")}
            value={quiz.opensAt}
          />
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

function QuizMetaItem({
  icon,
  label,
  value,
  className = "",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={[
        "grid min-h-[52px] grid-cols-[auto_1fr] items-center gap-x-2 border border-[#EBE4D8] bg-[#FFFDF8] px-2 py-2",
        className,
      ].join(" ")}
    >
      <span className="row-span-2 text-[#006E5A]">{icon}</span>
      <span className="q-mini text-[#5F5B55]">{label}</span>
      <span className="truncate text-[14px] font-semibold leading-5 text-[#211F20]">
        {value}
      </span>
    </div>
  );
}
