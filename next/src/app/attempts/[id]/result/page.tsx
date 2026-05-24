import { AttemptResult } from "@/components/attempts/AttemptResult";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";

type AttemptResultPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AttemptResultPage({
  params,
}: AttemptResultPageProps) {
  const { id } = await params;

  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <AttemptResult attemptId={Number(id)} />

      <MobileBottomNav />
    </main>
  );
}