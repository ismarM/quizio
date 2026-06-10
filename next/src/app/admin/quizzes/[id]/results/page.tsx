import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import {
  AdminQuizAttemptsLoading,
  AdminQuizAttemptsSection,
} from "@/components/admin/AdminQuizAttemptsSection";
import { SiteFooter } from "@/components/layout/SiteFooter";
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
  const t = await getTranslations("admin");
  const attemptsT = await getTranslations("admin.attempts");
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
            className="q-button q-button-secondary h-11 rounded-none border-2 border-[#211F20] bg-[#FFFAF2] px-4 text-[16px] text-[#211F20] shadow-[4px_4px_0_#EBE4D8] transition hover:-translate-y-0.5 hover:bg-[#EBE4D8] hover:text-[#211F20]"
            variant="outline"
          >
            <Link href={routes.admin}>
              <ArrowLeft data-icon="inline-start" />
              <span>{t("backToAdmin")}</span>
            </Link>
          </Button>
        </div>

        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
              {t("adminResults")}
            </p>

            <h1 className="font-display text-[56px] leading-[0.9] text-[#211F20] md:text-[86px]">
              {t("quizAttempts")}
            </h1>

            <p className="mt-4 max-w-2xl q-body text-[#211F20]">
              {t("resultsSubtitle")}
            </p>
          </div>
        </div>

        <Suspense
          fallback={
            <AdminQuizAttemptsLoading
              labels={{
                description: attemptsT("description"),
                eyebrow: attemptsT("eyebrow"),
                title: attemptsT("title"),
              }}
            />
          }
        >
          <AdminQuizAttemptsSection quizId={id} />
        </Suspense>
      </section>

      <SiteFooter />
      <MobileBottomNav />
    </main>
  );
}
