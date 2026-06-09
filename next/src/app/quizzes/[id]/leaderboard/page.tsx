import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
          className="q-button q-button-secondary mb-8 h-11 w-fit border-2 border-[#211F20] bg-[#FFFAF2] px-4 text-[16px] shadow-[3px_3px_0_#EBE4D8] transition hover:-translate-y-0.5 hover:bg-[#EBE4D8] hover:text-[#211F20]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to quiz
        </Link>

        <QuizLeaderboardTable quizId={quizId} />
      </section>

      <SiteFooter />
      <MobileBottomNav />
    </main>
  );
}
