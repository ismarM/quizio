import Link from "next/link";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { QuizLeaderboardTable } from "@/components/quizzes/QuizLeaderboardTable";
import { routes } from "@/lib/navigation/routes";

type LeaderboardPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function LeaderboardPage({ params }: LeaderboardPageProps) {
  const { id } = await params;
  const quizId = Number(id);

  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <section className="q-container py-8 md:py-16">
        <Link
          href={routes.quizDetail(quizId)}
          className="mb-8 inline-flex items-center gap-2 font-display text-lg hover:underline"
        >
          &larr; Back to quiz
        </Link>

        <QuizLeaderboardTable quizId={quizId} />
      </section>

      <SiteFooter />
      <MobileBottomNav />
    </main>
  );
}
