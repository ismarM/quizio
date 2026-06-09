import { AdminAttemptReviewLoading } from "@/components/admin/AdminAttemptReview";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";

export default function AdminAttemptReviewLoadingPage() {
  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <AdminAttemptReviewLoading />

      <SiteFooter />
      <MobileBottomNav />
    </main>
  );
}
