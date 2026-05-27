import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { QuizDetailCard } from "@/components/quizzes/QuizDetailCard";
import { QuizLeaderboardMini } from "@/components/quizzes/QuizLeaderboardMini";
import { mapQuizDtoToListItem } from "@/lib/quiz-mappers";
import { ServerFetchError, serverFetchJson } from "@/lib/serverFetch";
import { getSessionUser } from "@/lib/serverAuth";
import type { QuizResponse } from "@/lib/types";

type QuizDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function QuizDetailPage({ params }: QuizDetailPageProps) {
  const { id } = await params;
  let quiz;

  try {
    const data = await serverFetchJson<QuizResponse>(`/api/quizzes/${id}/info`);
    quiz = mapQuizDtoToListItem(data.quiz);
  } catch (error) {
    if (error instanceof ServerFetchError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const user = await getSessionUser();

  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <section className="q-container pb-12 pt-6 md:pb-20 md:pt-10">
        <div className="mb-6">
          <p className="mb-3 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
            Quiz detail
          </p>
        </div>

        <div className="grid gap-8">
          <QuizDetailCard quiz={quiz} isLoggedIn={Boolean(user)}/>
          <QuizLeaderboardMini quizId={quiz.id} />
        </div>
      </section>

      <SiteFooter />
      <MobileBottomNav />
    </main>
  );
}