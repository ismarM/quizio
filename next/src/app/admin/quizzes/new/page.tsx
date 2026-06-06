import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { requireAuth } from "@/lib/auth/server-auth";
import { AdminQuizForm } from "@/components/admin/AdminQuizForm";
import { serverFetchJson } from "@/lib/api/server-fetch";
import type { CategoryListResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewAdminQuizPage() {
  const t = await getTranslations("admin");
  const user = await requireAuth();

  if (!user.isAdmin) {
    redirect("/login?reason=unauthorized");
  }

  const categories = await loadCategories();

  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <section className="q-container pb-12 pt-6 md:pb-20 md:pt-10">
        <div className="mb-7">
          <p className="mb-3 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
            {t("admin")}
          </p>

          <h1 className="font-display text-[56px] leading-[0.9] text-[#211F20] md:text-[86px]">
            {t("createQuiz")}
          </h1>

          <p className="mt-4 max-w-2xl q-body text-[#211F20]">
            {t("newQuizSubtitle")}
          </p>
        </div>

        <AdminQuizForm categories={categories} />
      </section>

      <MobileBottomNav />
    </main>
  );
}

async function loadCategories() {
  const data = await serverFetchJson<CategoryListResponse>("/api/categories");
  return data.categories;
}
