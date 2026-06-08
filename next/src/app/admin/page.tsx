import Link from "next/link";
import {
  Archive,
  BarChart3,
  CalendarClock,
  FilePlus2,
  Home,
  Plus,
  UserRound,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { AdminQuizBrowser } from "@/components/admin/AdminQuizBrowser";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { mapQuizDtoToAdminListItem } from "@/components/admin/data/quiz-mappers";
import { routes } from "@/lib/navigation/routes";
import { ServerFetchError, serverFetchJson } from "@/lib/api/server-fetch";
import { requireAuth } from "@/lib/auth/server-auth";
import type { QuizListResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

const adminStats = [
  {
    labelKey: "drafts",
    shortLabelKey: "drafts",
    icon: FilePlus2,
    tone: "sand",
    metric: "drafts",
  },
  {
    labelKey: "scheduled",
    shortLabelKey: "scheduled",
    icon: CalendarClock,
    tone: "sand",
    metric: "scheduled",
  },
  {
    labelKey: "published",
    shortLabelKey: "published",
    icon: BarChart3,
    tone: "green",
    metric: "published",
  },
  {
    labelKey: "archivedLocked",
    shortLabelKey: "archived",
    icon: Archive,
    tone: "sand",
    metric: "archived",
  },
] as const;

export default async function AdminPage() {
  const t = await getTranslations("admin");
  const user = await requireAuth();

  if (!user.isAdmin) {
    redirect("/login?reason=unauthorized");
  }

  const { quizzes, archivedCount } = await loadAdminQuizzes();
  const draftCount = quizzes.filter((quiz) => quiz.status === "draft").length;
  const scheduledCount = quizzes.filter(
    (quiz) => quiz.status === "scheduled"
  ).length;
  const publishedCount = quizzes.filter(
    (quiz) => quiz.status === "published"
  ).length;
  const statValues = {
    drafts: draftCount,
    scheduled: scheduledCount,
    published: publishedCount,
    archived: archivedCount,
  };
  const stats = adminStats.map((stat) => ({
    ...stat,
    value: statValues[stat.metric],
  }));

  return (
    <main className="q-page min-h-screen bg-[#FFFAF2] text-[#211F20]">
      <SiteHeader />
      <div className="min-h-screen w-full bg-[#FFFAF2]">
        <section className="min-w-0 pb-24 lg:pb-0">
          <div className="q-container animate-in fade-in slide-in-from-bottom-4 pb-7 pt-5 duration-500 lg:py-9">
            <div className="mb-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
              <div>
                <p className="mb-3 q-mini font-bold tracking-[0.18em] text-[#006E5A]">
                  {t("dashboardLabel")}
                </p>

                <h1 className="font-display text-[46px] leading-[0.84] text-[#211F20] md:text-[72px] lg:text-[88px]">
                  {t("manageQuizzes")}
                </h1>

                <p className="mt-4 max-w-[470px] text-[15px] leading-6 text-[#211F20]">
                  {t("subtitle")}
                </p>
              </div>

              <Button
                asChild
                className="q-button q-button-primary h-12 rounded-none border-[#FF3C38] bg-[#FF3C38] px-7 text-xl shadow-[4px_4px_0_#211F20] transition duration-200 hover:-translate-y-0.5 hover:bg-[#D92F2B] hover:shadow-[6px_6px_0_#211F20] lg:h-14"
              >
                <Link href={routes.adminQuizNew}>
                  <Plus className="h-5 w-5" />
                  {t("createQuiz")}
                </Link>
              </Button>
            </div>

            <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-5">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <article
                    className="grid min-h-[74px] grid-cols-[44px_1fr] items-center gap-3 border-2 border-[#211F20] bg-[#FFFDF8] p-3 transition duration-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#EBE4D8] lg:min-h-[104px] lg:grid-cols-[56px_1fr] lg:p-5"
                    key={stat.labelKey}
                  >
                    <div
                      className={[
                        "flex h-10 w-10 items-center justify-center border-2 border-[#211F20] lg:h-12 lg:w-12",
                        stat.tone === "green"
                          ? "bg-[#006E5A] text-[#FFFAF2]"
                          : "bg-[#EBE4D8] text-[#211F20]",
                      ].join(" ")}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </div>

                    <div>
                      <p className="font-display text-[32px] leading-none text-[#211F20] lg:text-[40px]">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-[12px] leading-4 text-[#211F20]">
                        <span className="lg:hidden">{t(stat.shortLabelKey)}</span>
                        <span className="hidden lg:inline">{t(stat.labelKey)}</span>
                      </p>
                    </div>
                  </article>
                );
              })}
            </section>

          <AdminQuizBrowser quizzes={quizzes} />
          </div>
        </section>
      </div>

      <AdminMobileBottomNav />
    </main>
  );
}

async function AdminMobileBottomNav() {
  const t = await getTranslations("admin");
  const items = [
    { label: t("overview"), href: routes.admin, icon: Home },
    { label: t("drafts"), href: `${routes.admin}?status=draft`, icon: FilePlus2 },
    { label: t("archived"), href: routes.adminArchivedQuizzes, icon: Archive },
    { label: t("profile"), href: routes.dashboard, icon: UserRound },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-50 grid h-20 w-full grid-cols-[1fr_1fr_72px_1fr_1fr] border-t border-[#D7D0C4] bg-[#FFFAF2] lg:hidden">
      {items.slice(0, 2).map((item) => (
        <MobileNavItem item={item} key={item.label} />
      ))}

      <Link
        className="-mt-5 flex h-16 w-16 items-center justify-center justify-self-center rounded-full border-2 border-[#211F20] bg-[#006E5A] text-[#FFFAF2] shadow-[0_8px_22px_rgba(0,0,0,0.18)] transition hover:-translate-y-1"
        href={routes.adminQuizNew}
      >
        <Plus className="h-8 w-8" />
      </Link>

      {items.slice(2).map((item) => (
        <MobileNavItem item={item} key={item.label} />
      ))}
    </nav>
  );
}

function MobileNavItem({
  item,
}: {
  item: { label: string; href: string; icon: typeof Home };
}) {
  const Icon = item.icon;

  return (
    <Link
      className="flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-[#211F20] first:text-[#006E5A]"
      href={item.href}
    >
      <Icon className="h-5 w-5" strokeWidth={1.8} />
      {item.label}
    </Link>
  );
}

async function loadAdminQuizzes() {
  try {
    const [published, drafts, archived] = await Promise.all([
      fetchQuizzes("published"),
      fetchQuizzes("not_published"),
      fetchQuizzes("archived"),
    ]);

    const all = [...drafts, ...published];
    const uniqueById = new Map<number, (typeof all)[number]>();
    all.forEach((quiz) => {
      uniqueById.set(quiz.id, quiz);
    });
    const archivedById = new Map<number, (typeof archived)[number]>();
    archived.forEach((quiz) => {
      archivedById.set(quiz.id, quiz);
    });

    const activeQuizzes = Array.from(uniqueById.values());

    return {
      quizzes: activeQuizzes.map(mapQuizDtoToAdminListItem),
      archivedCount: archivedById.size,
    };
  } catch (error) {
    if (error instanceof ServerFetchError && error.status === 401) {
      return { quizzes: [], archivedCount: 0 };
    }
    throw error;
  }
}

async function fetchQuizzes(scope: "published" | "not_published" | "archived") {
  const data = await serverFetchJson<QuizListResponse>(
    `/api/quizzes?scope=${scope}&limit=50&offset=0`
  );
  return data.quizzes;
}
