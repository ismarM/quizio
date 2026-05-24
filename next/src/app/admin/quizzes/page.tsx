import { redirect } from "next/navigation";

import { AdminQuizBrowser } from "@/components/admin/AdminQuizBrowser";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { adminQuizzes } from "@/lib/mock-data";
import { requireAuth } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export default async function AdminQuizzesPage() {
  const user = await requireAuth();

  if (!user.isAdmin) {
    redirect("/login?reason=unauthorized");
  }

  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <section className="q-container pb-12 pt-6 md:pb-20 md:pt-10">
        <div className="mb-7">
          <p className="mb-3 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
            Admin
          </p>

          <h1 className="font-display text-[56px] leading-[0.9] text-[#211F20] md:text-[86px]">
            Manage quizzes
          </h1>

          <p className="mt-4 max-w-2xl q-body text-[#211F20]">
            Search, review and manage quiz drafts, published quizzes and archived
            content.
          </p>
        </div>

        <AdminQuizBrowser quizzes={adminQuizzes} />
      </section>

      <MobileBottomNav />
    </main>
  );
}