import { AdminQuizAttemptsLoading } from "@/components/admin/AdminQuizAttemptsSection";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";

export default function AdminQuizResultsLoadingPage() {
  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <section className="q-container pb-12 pt-6 md:pb-20 md:pt-10">
        <div className="mb-7 grid gap-3">
          <div className="h-8 w-32 animate-pulse bg-[#EBE4D8]" />
          <div className="h-20 max-w-2xl animate-pulse bg-[#EBE4D8]" />
          <div className="h-6 max-w-xl animate-pulse bg-[#EBE4D8]" />
        </div>

        <AdminQuizAttemptsLoading />
      </section>

      <MobileBottomNav />
    </main>
  );
}
