import { redirect } from "next/navigation";

import { FeatureCards } from "@/components/home/FeatureCards";
import { HeroSection } from "@/components/home/HeroSection";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { routes } from "@/lib/navigation/routes";
import { getSessionUser } from "@/lib/auth/server-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getSessionUser();

  if (user) {
    redirect(routes.quizzes);
  }

  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader showPublicNavLinks={false} />
      <HeroSection />
      <FeatureCards />
      <SiteFooter />
      <MobileBottomNav showQuizzes={false} />
    </main>
  );
}
