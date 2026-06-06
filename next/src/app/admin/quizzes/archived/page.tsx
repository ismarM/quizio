import Link from "next/link";
import { Archive, ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { AdminQuizBrowser } from "@/components/admin/AdminQuizBrowser";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { mapQuizDtoToAdminListItem } from "@/components/admin/data/quiz-mappers";
import { routes } from "@/lib/navigation/routes";
import { ServerFetchError, serverFetchJson } from "@/lib/api/server-fetch";
import { requireAuth } from "@/lib/auth/server-auth";
import type { QuizListResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ArchivedAdminQuizzesPage() {
  const t = await getTranslations("admin");
  const user = await requireAuth();

  if (!user.isAdmin) {
    redirect("/login?reason=unauthorized");
  }

  const quizzes = await loadArchivedQuizzes();

  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <section className="q-container pb-12 pt-6 md:pb-20 md:pt-10">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
              {t("adminArchive")}
            </p>

            <h1 className="font-display text-[56px] leading-[0.9] text-[#211F20] md:text-[86px]">
              {t("archivedQuizzes")}
            </h1>

            <p className="mt-4 max-w-2xl q-body text-[#211F20]">
              {t("archiveSubtitle")}
            </p>
          </div>

          <Link href={routes.admin} className="q-button q-button-secondary">
            <ArrowLeft className="h-4 w-4" />
            {t("backToAdmin")}
          </Link>
        </div>

        <section className="border-2 border-[#211F20] bg-[#FFFAF2] p-5 md:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
                {t("storedArchive")}
              </p>

              <h2 className="font-display text-[48px] leading-none text-[#211F20]">
                {t("quizArchive")}
              </h2>
            </div>

            <div className="flex h-12 w-12 items-center justify-center border-2 border-[#211F20] bg-[#EBE4D8] text-[#006E5A]">
              <Archive className="h-6 w-6" />
            </div>
          </div>

          <div className="h-[2px] bg-[#211F20]" />

          <div className="mt-4">
            <AdminQuizBrowser archivedView quizzes={quizzes} />
          </div>
        </section>
      </section>

      <MobileBottomNav />
    </main>
  );
}

async function loadArchivedQuizzes() {
  try {
    const data = await serverFetchJson<QuizListResponse>(
      "/api/quizzes?scope=archived&limit=100&offset=0"
    );

    return data.quizzes.map(mapQuizDtoToAdminListItem);
  } catch (error) {
    if (error instanceof ServerFetchError && error.status === 401) {
      return [];
    }
    throw error;
  }
}
