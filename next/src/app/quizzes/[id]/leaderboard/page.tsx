"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Trophy } from "lucide-react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { routes } from "@/lib/routes";
import { useLeaderboard } from "@/lib/useLeaderboard";
import { formatScore, getDisplayName, formatTime } from "@/lib/leaderboard-utils";

export default function LeaderboardPage() {
  const params = useParams();
  const quizId = parseInt(params.id as string, 10);
  const { entries, isConnected } = useLeaderboard(quizId);

  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <section className="q-container py-8 md:py-16">
        <Link
          href={routes.quizDetail(quizId)}
          className="mb-8 inline-flex items-center gap-2 font-display text-lg hover:underline"
        >
          &larr; Back to quiz
        </Link>

        <div className="mb-12">
          <div className="flex items-center gap-4">
            <p className="inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
              Leaderboard
            </p>
            {isConnected && (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 animate-pulse rounded-full bg-[#006E5A]" />
                <span className="font-display text-[#006E5A]">Live</span>
              </div>
            )}
          </div>
          <h1 className="mt-4 font-display text-[56px] leading-[0.9] text-[#211F20] md:text-[86px]">
            Rankings
          </h1>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="font-display text-xl text-[#211F20]">
                <th className="sticky top-0 z-10 border-b-2 border-[#211F20] bg-[#FFFAF2] py-4 pr-4 w-20">Rank</th>
                <th className="sticky top-0 z-10 border-b-2 border-[#211F20] bg-[#FFFAF2] py-4 pr-4">Player</th>
                <th className="sticky top-0 z-10 border-b-2 border-[#211F20] bg-[#FFFAF2] py-4 pr-4">Score</th>
                <th className="sticky top-0 z-10 border-b-2 border-[#211F20] bg-[#FFFAF2] py-4">Time</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-lg opacity-60">
                    No one has completed this quiz yet.
                  </td>
                </tr>
              ) : (
                entries.map((entry, index) => {
                  const rank = index + 1;
                  const isFirst = rank === 1;
                  const scorePerc = Math.round((entry.achieved_points / entry.max_points) * 100);

                  return (
                    <tr
                      key={entry.user_id}
                      className="border-b border-[#D7D0C4] last:border-b-0"
                    >
                      <td className="py-4 pr-4">
                        <span
                          className={[
                            "flex h-10 w-10 items-center justify-center font-display text-xl",
                            isFirst
                              ? "bg-[#FF3C38] text-[#FFFAF2]"
                              : "bg-[#EBE4D8] text-[#211F20]",
                          ].join(" ")}
                        >
                          {isFirst ? <Trophy className="h-5 w-5" /> : rank}
                        </span>
                      </td>
                      <td className="py-4 pr-4 q-body text-xl font-bold">
                        {getDisplayName(entry)}
                      </td>
                      <td className="py-4 pr-4">
                        <div className="font-display text-2xl text-[#006E5A]">
                          {formatScore(entry.achieved_points, entry.max_points)}
                        </div>
                        <div className="text-sm opacity-70">
                          {scorePerc}% correct
                        </div>
                      </td>
                      <td className="py-4 font-display text-xl">
                        {formatTime(entry.time_taken_seconds)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <SiteFooter />
      <MobileBottomNav />
    </main>
  );
}
