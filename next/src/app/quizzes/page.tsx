import { getTranslations } from "next-intl/server";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { QuizBrowser } from "@/components/quizzes/QuizBrowser";
import { mapQuizDtoToListItem } from "@/lib/mappers/quiz";
import { serverFetchJson } from "@/lib/api/server-fetch";
import type {
  OpenSessionsResponse,
  QuizListItem,
  QuizListResponse,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
  const t = await getTranslations("quizzes");
  let quizzes: QuizListItem[] = [];

  try {
    const [data, sessions] = await Promise.all([
      serverFetchJson<QuizListResponse>("/api/quizzes?limit=20&offset=0"),
      serverFetchJson<OpenSessionsResponse>("/api/users/me/open-sessions"),
    ]);
    const openQuizIds = new Set(
      sessions.attempts.map((session) => session.attempt.quiz_id)
    );

    quizzes = data.quizzes.map((quiz) => ({
      ...mapQuizDtoToListItem(quiz),
      hasOpenAttempt: openQuizIds.has(quiz.id),
    }));
  } catch (error) {
    console.error("Failed to load quizzes:", error);
  }

  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <section className="q-container pb-10 pt-6 md:pb-12 md:pt-10">
        <div className="mb-7">
          <p className="mb-3 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
            {t("pageLabel")}
          </p>

          <h1 className="font-display text-[56px] leading-[0.9] text-[#211F20] md:text-[86px]">
            {t("heading")}
          </h1>

          <p className="mt-4 max-w-2xl q-body text-[#211F20]">
            {t("subtitle")}
          </p>
        </div>

        <QuizBrowser quizzes={quizzes} />
      </section>

      <SiteFooter />
      <MobileBottomNav />
    </main>
  );
}
