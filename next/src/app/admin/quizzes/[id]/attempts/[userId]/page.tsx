import { notFound, redirect } from "next/navigation";

import { AdminAttemptReview } from "@/components/admin/AdminAttemptReview";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { loadAdminQuizAttemptReview } from "@/components/admin/data/quiz-results.server";
import { ServerFetchError } from "@/lib/api/server-fetch";
import { requireAuth } from "@/lib/auth/server-auth";

export const dynamic = "force-dynamic";

type AdminAttemptReviewPageProps = {
  params: Promise<{
    id: string;
    userId: string;
  }>;
};

export default async function AdminAttemptReviewPage({
  params,
}: AdminAttemptReviewPageProps) {
  const user = await requireAuth();

  if (!user.isAdmin) {
    redirect("/login?reason=unauthorized");
  }

  const { id, userId } = await params;

  if (!isPositiveID(id) || !isPositiveID(userId)) {
    notFound();
  }

  let review: Awaited<ReturnType<typeof loadAdminQuizAttemptReview>>;

  try {
    review = await loadAdminQuizAttemptReview(id, userId);
  } catch (error) {
    if (error instanceof ServerFetchError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <AdminAttemptReview review={review} />

      <SiteFooter />
      <MobileBottomNav />
    </main>
  );
}

function isPositiveID(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0;
}
