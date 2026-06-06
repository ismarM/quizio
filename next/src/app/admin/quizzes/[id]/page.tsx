import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AdminQuizEditor } from "@/components/admin/AdminQuizEditor";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { mapFullQuizToAdminDetail } from "@/components/admin/data/quiz-mappers";
import { ServerFetchError, serverFetchJson } from "@/lib/api/server-fetch";
import { requireAuth } from "@/lib/auth/server-auth";
import type { CategoryListResponse, QuizFullResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

type AdminQuizDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminQuizDetailPage({
  params,
}: AdminQuizDetailPageProps) {
  const t = await getTranslations("admin");
  const user = await requireAuth();

  if (!user.isAdmin) {
    redirect("/login?reason=unauthorized");
  }

  const { id } = await params;
  let quiz;
  let categories;

  try {
    const [data, categoryData] = await Promise.all([
      serverFetchJson<QuizFullResponse>(`/api/quizzes/${id}`),
      serverFetchJson<CategoryListResponse>("/api/categories"),
    ]);
    quiz = mapFullQuizToAdminDetail(data.quiz, data.questions);
    categories = categoryData.categories;
  } catch (error) {
    if (error instanceof ServerFetchError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <section className="q-container pb-12 pt-6 md:pb-20 md:pt-10">
        <div className="mb-7">
          <p className="mb-3 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
            {t("admin")}
          </p>

          <h1 className="font-display text-[56px] leading-[0.9] text-[#211F20] md:text-[86px]">
            {t("editQuiz")}
          </h1>

          <p className="mt-4 max-w-2xl q-body text-[#211F20]">
            {t("editQuizSubtitle")}
          </p>
        </div>

        <AdminQuizEditor categories={categories} quiz={quiz} />
      </section>

      <MobileBottomNav />
    </main>
  );
}
