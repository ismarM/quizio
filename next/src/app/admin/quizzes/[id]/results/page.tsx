import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import {
  AdminQuizAttemptsLoading,
  AdminQuizAttemptsSection,
} from "@/components/admin/AdminQuizAttemptsSection";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/navigation/routes";
import { requireAuth } from "@/lib/auth/server-auth";

export const dynamic = "force-dynamic";

type AdminQuizResultsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminQuizResultsPage({
  params,
}: AdminQuizResultsPageProps) {
  const user = await requireAuth();

  if (!user.isAdmin) {
    redirect("/login?reason=unauthorized");
  }

  const { id } = await params;

  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <section className="q-container pb-12 pt-6 md:pb-20 md:pt-10">
        <div className="mb-6 flex">
          <Button
            asChild
            className="q-button q-button-secondary rounded-none border-[#211F20] bg-[#FFFAF2] text-[#211F20] shadow-[4px_4px_0_#211F20] hover:bg-[#EBE4D8]"
            variant="outline"
          >
            <Link href={routes.admin}>
              <ArrowLeft data-icon="inline-start" />
              Back to admin
            </Link>
          </Button>
        </div>

        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
              Admin results
            </p>

            <h1 className="font-display text-[56px] leading-[0.9] text-[#211F20] md:text-[86px]">
              Quiz attempts
            </h1>

            <p className="mt-4 max-w-2xl q-body text-[#211F20]">
              Review all users who started or submitted this quiz.
            </p>
          </div>
        </div>

        <Suspense fallback={<AdminQuizAttemptsLoading />}>
          <AdminQuizAttemptsSection quizId={id} />
        </Suspense>
      </section>

      <MobileBottomNav />
    </main>
  );
}
