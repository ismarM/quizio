import Link from "next/link";
import {
  BarChart3,
  Clock3,
  ListChecks,
  Medal,
  Play,
  UserRound,
} from "lucide-react";

import LogoutButton from "@/components/auth/LogoutButton";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { routes } from "@/lib/routes";
import { requireAuth } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

const recentAttempts = [
  {
    quizTitle: "Science Fundamentals",
    score: "15/20",
    status: "Completed",
    date: "May 24",
  },
  {
    quizTitle: "Geography Basics",
    score: "12/15",
    status: "Completed",
    date: "May 22",
  },
  {
    quizTitle: "Math Challenge",
    score: "In progress",
    status: "Continue",
    date: "Today",
  },
];

const recommendedQuizzes = [
  {
    title: "Technology Essentials",
    meta: "18 questions · 15 min",
  },
  {
    title: "World Capitals",
    meta: "22 questions · 15 min",
  },
];

export default async function DashboardPage() {
  const user = await requireAuth();

  const displayName = user.displayName || user.email?.split("@")[0] || "User";
  const initial = displayName.slice(0, 1).toUpperCase();

  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <section className="q-container pb-12 pt-6 md:pb-20 md:pt-10">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
              Dashboard
            </p>

            <h1 className="font-display text-[56px] leading-[0.9] text-[#211F20] md:text-[86px]">
              Welcome back.
            </h1>

            <p className="mt-4 max-w-xl q-body text-[#211F20]">
              Track your quiz progress, continue attempts and discover new
              quizzes.
            </p>
          </div>

          <LogoutButton className="q-button q-button-secondary w-fit" />
        </div>

        <div className="grid gap-6 md:grid-cols-[0.85fr_1.15fr]">
          <aside className="grid content-start gap-6">
            <section className="border-2 border-[#211F20] bg-[#EBE4D8] p-5 shadow-[8px_8px_0_#211F20] md:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center border-2 border-[#211F20] bg-[#FFFAF2] font-display text-4xl text-[#006E5A]">
                  {initial || <UserRound className="h-8 w-8" />}
                </div>

                <div className="min-w-0">
                  <p className="font-display text-4xl leading-none text-[#211F20]">
                    {displayName}
                  </p>
                  <p className="mt-2 break-all q-body text-[#211F20]">
                    {user.email ?? "unknown email"}
                  </p>
                </div>
              </div>

              <div className="my-5 h-[2px] bg-[#211F20]" />

              <div className="grid gap-3">
                <Link
                  href={routes.quizzes}
                  className="q-button q-button-primary border-[#FF3C38] bg-[#FF3C38]"
                >
                  <Play className="h-4 w-4" />
                  Explore quizzes
                </Link>

                <Link
                  href={routes.home}
                  className="q-button q-button-secondary"
                >
                  Back home
                </Link>
              </div>
            </section>

            <section className="border-2 border-[#211F20] bg-[#006E5A] p-5 text-[#FFFAF2] md:p-6">
              <p className="font-display text-[42px] leading-[0.9]">
                Keep improving.
              </p>
              <p className="mt-4 q-body">
                Your results help you see progress over time. Complete more
                quizzes to build your profile history.
              </p>
            </section>
          </aside>

          <div className="grid gap-6">
            <section className="grid gap-4 sm:grid-cols-3">
              <StatCard
                icon={<ListChecks className="h-5 w-5" />}
                label="Completed"
                value="2"
              />
              <StatCard
                icon={<BarChart3 className="h-5 w-5" />}
                label="Average"
                value="78%"
              />
              <StatCard
                icon={<Medal className="h-5 w-5" />}
                label="Best score"
                value="15/20"
              />
            </section>

            <section className="border-2 border-[#211F20] bg-[#FFFAF2] p-5 md:p-6">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-2 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
                    Activity
                  </p>
                  <h2 className="font-display text-[48px] leading-none text-[#211F20]">
                    Recent attempts
                  </h2>
                </div>
              </div>

              <div className="h-[2px] bg-[#211F20]" />

              <div className="mt-4 grid gap-3">
                {recentAttempts.map((attempt) => (
                  <article
                    key={attempt.quizTitle}
                    className="grid gap-3 border border-[#D7D0C4] p-4 md:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <p className="font-display text-2xl leading-none text-[#211F20]">
                        {attempt.quizTitle}
                      </p>
                      <p className="mt-1 q-mini text-[#8F8F8F]">
                        {attempt.date} · {attempt.status}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 md:justify-end">
                      <span className="font-display text-2xl text-[#006E5A]">
                        {attempt.score}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="border-2 border-[#211F20] bg-[#FFFAF2] p-5 md:p-6">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-2 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
                    Recommended
                  </p>
                  <h2 className="font-display text-[48px] leading-none text-[#211F20]">
                    Try next
                  </h2>
                </div>

                <Link
                  href={routes.quizzes}
                  className="q-button q-button-secondary hidden md:inline-flex"
                >
                  View all
                </Link>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {recommendedQuizzes.map((quiz) => (
                  <Link
                    key={quiz.title}
                    href={routes.quizzes}
                    className="border-2 border-[#EBE4D8] bg-[#FFFAF2] p-4 transition hover:border-[#211F20] hover:shadow-[6px_6px_0_#EBE4D8]"
                  >
                    <p className="font-display text-3xl leading-none text-[#211F20]">
                      {quiz.title}
                    </p>
                    <p className="mt-2 q-mini text-[#8F8F8F]">{quiz.meta}</p>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>

      <MobileBottomNav />
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="border-2 border-[#211F20] bg-[#FFFAF2] p-4">
      <div className="mb-4 flex h-10 w-10 items-center justify-center bg-[#DDECE8] text-[#006E5A]">
        {icon}
      </div>

      <p className="q-mini text-[#8F8F8F]">{label}</p>
      <p className="mt-1 font-display text-[42px] leading-none text-[#211F20]">
        {value}
      </p>
    </article>
  );
}