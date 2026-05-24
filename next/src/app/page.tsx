import { FeatureCards } from "@/components/home/FeatureCards";
import { HeroSection } from "@/components/home/HeroSection";
import { TestimonialSection } from "@/components/home/TestimonialSection";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";

export default function Home() {
  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />
      <HeroSection />
      <FeatureCards />
      <TestimonialSection />
      <SiteFooter />
      <MobileBottomNav />
    </main>
  );
}