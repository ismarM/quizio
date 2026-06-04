import { redirect } from "next/navigation";

import { FeatureCards } from "@/components/home/FeatureCards";
import { HeroSection } from "@/components/home/HeroSection";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { routes } from "@/lib/routes";
import { getSessionUser } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getSessionUser();

  if (user) {
    redirect(routes.quizzes);
  }

  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />
      <HeroSection />
      <FeatureCards />
      <SiteFooter />
      <MobileBottomNav />
    </main>
  );
}
