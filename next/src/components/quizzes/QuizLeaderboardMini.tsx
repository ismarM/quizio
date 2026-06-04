"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";

import { routes } from "@/lib/navigation/routes";
import { useLeaderboard } from "@/lib/hooks/use-leaderboard";
import type { LeaderboardEntryDTO } from "@/lib/types";

type QuizLeaderboardMiniProps = {
  quizId: number;
};

export function QuizLeaderboardMini({ quizId }: QuizLeaderboardMiniProps) {
  const { entries, isConnected } = useLeaderboard(quizId);
  const topEntries = entries.slice(0, 5);
  const isLoading = entries.length === 0 && isConnected;

  return (
    <section className="grid gap-5 md:grid-cols-[0.75fr_1.25fr]">
      <div className="border-2 border-[#211F20] bg-[#006E5A] p-6 text-[#FFFAF2]">
        <Trophy className="mb-6 h-12 w-12" strokeWidth={1.8} />

        <p className="font-display text-[48px] leading-[0.9]">
          Compete on the leaderboard.
        </p>

        <p className="mt-4 q-body">
          Scores are public for this quiz. Higher score ranks first, with faster
          completion used as a tie breaker later.
        </p>

        <Link
          href={routes.quizLeaderboard(quizId)}
          className="q-button mt-6 border-[#FFFAF2] bg-[#FFFAF2] text-[#211F20] hover:bg-[#FF3C38] hover:text-[#FFFAF2]"
        >
          View full ranking
        </Link>
      </div>

      <div className="border-2 border-[#211F20] bg-[#FFFAF2] p-5 md:p-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
              Ranking
            </p>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-[48px] leading-none text-[#211F20]">
                Top results
              </h2>
              {isConnected && (
                <div className="h-3 w-3 animate-pulse rounded-full bg-[#006E5A]" title="Live" />
              )}
            </div>
          </div>

          <Link
            href={routes.quizLeaderboard(quizId)}
            className="q-button q-button-secondary hidden md:inline-flex"
          >
            View all
          </Link>
        </div>

        <div className="h-[2px] bg-[#211F20]" />

        <div className="mt-4 grid gap-2">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="grid grid-cols-[48px_1fr_auto] items-center border-b border-[#D7D0C4] py-3 last:border-b-0 animate-pulse"
                >
                  <div className="h-9 w-9 bg-[#EBE4D8]" />
                  <div className="h-5 w-32 bg-[#EBE4D8]" />
                  <div className="h-6 w-16 bg-[#EBE4D8]" />
                </div>
              ))}
            </>
          ) : topEntries.length > 0 ? (
            topEntries.map((item, index) => {
              const rank = index + 1;
              return (
                <div
                  key={item.user_id}
                  className="grid grid-cols-[48px_1fr_auto] items-center border-b border-[#D7D0C4] py-3 last:border-b-0"
                >
                  <span
                    className={[
                      "flex h-9 w-9 items-center justify-center font-display text-xl",
                      rank === 1
                        ? "bg-[#FF3C38] text-[#FFFAF2]"
                        : "bg-[#EBE4D8] text-[#211F20]",
                    ].join(" ")}
                  >
                    {rank}
                  </span>

                  <span className="q-body text-[#211F20]">
                    {getDisplayName(item)}
                  </span>

                  <span className="font-display text-2xl text-[#006E5A]">
                    {formatScore(item.achieved_points, item.max_points)}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-[#211F20] opacity-60">
              No results yet
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function formatScore(achieved: number, max: number): string {
  return `${Math.round(achieved)}/${Math.round(max)} pts`;
}

function getDisplayName(entry: LeaderboardEntryDTO): string {
  return entry.display_name || entry.email.split("@")[0];
}
