import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { QuizBrowser } from "@/components/quizzes/QuizBrowser";
import { loadQuizAttemptCounts } from "@/lib/admin-quiz-attempt-counts";
import { mapQuizDtoToListItem } from "@/lib/quiz-mappers";
import { getSessionUser } from "@/lib/serverAuth";
import { serverFetchJson } from "@/lib/serverFetch";
import type { QuizListItem, QuizListResponse } from "@/lib/types";

export default async function QuizzesPage() {
  let quizzes: QuizListItem[] = [];

  try {
    const data = await serverFetchJson<QuizListResponse>(
      "/api/quizzes?limit=20&offset=0"
    );
    quizzes = data.quizzes.map(mapQuizDtoToListItem);

    const user = await getSessionUser();
    if (user?.isAdmin) {
      const attemptCounts = await loadQuizAttemptCounts(data.quizzes);
      quizzes = quizzes.map((quiz) => ({
        ...quiz,
        plays: String(attemptCounts.get(quiz.id) ?? 0),
      }));
    }
  } catch (error) {
    console.error("Failed to load quizzes:", error);
  }

  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <section className="q-container pb-10 pt-6 md:pb-12 md:pt-10">
        <div className="mb-7">
          <p className="mb-3 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
            Explore
          </p>

          <h1 className="font-display text-[56px] leading-[0.9] text-[#211F20] md:text-[86px]">
            Explore quizzes
          </h1>

          <p className="mt-4 max-w-2xl q-body text-[#211F20]">
            Discover quizzes on any topic and challenge your knowledge.
          </p>
        </div>

        <QuizBrowser quizzes={quizzes} />
      </section>

      <SiteFooter />
      <MobileBottomNav />
    </main>
  );
}
