import Link from "next/link";
import {
  BarChart3,
  FilePlus2,
  LayoutDashboard,
  ListChecks,
  LockKeyhole
} from "lucide-react";
import { redirect } from "next/navigation";

import { AdminQuizBrowser } from "@/components/admin/AdminQuizBrowser";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { adminQuizzes } from "@/lib/mock-data";
import { routes } from "@/lib/routes";
import { requireAuth } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

const adminStats = [
  {
    label: "Total quizzes",
    value: "8",
    icon: ListChecks,
  },
  {
    label: "Published",
    value: "6",
    icon: BarChart3,
  },
]

const adminActions = [
  {
    title: "Create new quiz",
    description: "Start a new quiz draft with title, time limit and questions.",
    href: routes.adminQuizNew,
    icon: FilePlus2,
    primary: true,
  },
];

export default async function AdminPage() {
  const user = await requireAuth();

  if (!user.isAdmin) {
    redirect("/login?reason=unauthorized");
  }

  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <section className="q-container pb-12 pt-6 md:pb-20 md:pt-10">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
              Admin panel
            </p>

            <h1 className="font-display text-[56px] leading-[0.9] text-[#211F20] md:text-[86px]">
              Manage Quizio.
            </h1>

            <p className="mt-4 max-w-2xl q-body text-[#211F20]">
              Create quizzes, publish content, review attempts and manage the
              quiz platform from one place.
            </p> 
          </div>

        </div>

        <div className="grid gap-6 md:grid-cols-[0.85fr_1.15fr]">
          <aside className="grid content-start gap-6">
            <section className="border-2 border-[#211F20] bg-[#EBE4D8] p-5 shadow-[8px_8px_0_#211F20] md:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center border-2 border-[#211F20] bg-[#FFFAF2] text-[#006E5A]">
                  <LayoutDashboard className="h-8 w-8"/>
                </div>

                <div className="min-w-0">
                  <p className="font-display text-4xl leading-none text-[#211F20]">
                    Admin access
                  </p>
                  <p className="mt-2 break-all q-body text-[#211F20]">
                    {user.email ?? "unknown email"}
                  </p>
                </div>
              </div>

              <div className="my-5 h-[2px] bg-[#211F20]" />

              <div className="grid gap-3">
                <Link
                  href={routes.adminQuizNew}
                  className="q-button q-button-primary border-[#FF3C38] bg-[#FF3C38]"
                >
                  <FilePlus2 className="h-4 w-4" />
                  Create quiz
                </Link>
              </div>
            </section>

            <section className="border-2 border-[#211F20] bg-[#006E5A] p-5 text-[#FFFAF2] md:p-6">
              <LockKeyhole className="mb-5 h-10 w-10" />

              <p className="font-display text-[42px] leading-[0.9]">
                Published quizzes are locked.
              </p>

              <p className="mt-4 q-body">
                Once a quiz is published, questions and answers should not be
                changed. Create a duplicate if a new version is needed.
              </p>
            </section>
          </aside>

          <div className="grid gap-6">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {adminStats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <article
                    key={stat.label}
                    className="border-2 border-[#211F20] bg-[#FFFAF2] p-4"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center bg-[#DDECE8] text-[#006E5A]">
                      <Icon className="h-5 w-5" />
                    </div>

                    <p className="q-mini text-[#8F8F8F]">{stat.label}</p>
                    <p className="mt-1 font-display text-[42px] leading-none text-[#211F20]">
                      {stat.value}
                    </p>
                  </article>
                );
              })}
            </section>

            <section className="border-2 border-[#211F20] bg-[#FFFAF2] p-5 md:p-6">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-2 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
                    All quizzes
                  </p>

                  <h2 className="font-display text-[48px] leading-none text-[#211F20]">
                    Quiz list
                  </h2>
                </div>
              </div>

              <div className="h-[2px] bg-[#211F20]" />

              <div className="mt-4">
                <AdminQuizBrowser quizzes={adminQuizzes} />
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}