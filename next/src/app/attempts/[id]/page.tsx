import { AttemptPlayer } from "@/components/attempts/AttemptPlayer";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { mockAttempt } from "@/lib/mock-data";

type AttemptPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AttemptPage({ params }: AttemptPageProps) {
  const { id } = await params;

  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <AttemptPlayer
        attemptId={Number(id)}
        quizTitle={mockAttempt.quizTitle}
        timeLeft={mockAttempt.timeLeft}
        questions={mockAttempt.questions}
      />

      <MobileBottomNav />
    </main>
  );
}