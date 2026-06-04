"use client";

import { Trophy } from "lucide-react";

import { useLeaderboard } from "@/lib/hooks/use-leaderboard";
import type { LeaderboardEntryDTO } from "@/lib/types";

type QuizLeaderboardTableProps = {
  quizId: number;
};

export function QuizLeaderboardTable({ quizId }: QuizLeaderboardTableProps) {
  const { entries, isConnected } = useLeaderboard(quizId);

  return (
    <>
      <div className="mb-12">
        <div className="flex items-center gap-4">
          <p className="inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
            Leaderboard
          </p>
          {isConnected ? (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 animate-pulse rounded-full bg-[#006E5A]" />
              <span className="font-display text-[#006E5A]">Live</span>
            </div>
          ) : null}
        </div>
        <h1 className="mt-4 font-display text-[56px] leading-[0.9] text-[#211F20] md:text-[86px]">
          Rankings
        </h1>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="font-display text-xl text-[#211F20]">
              <th className="sticky top-0 z-10 w-20 border-b-2 border-[#211F20] bg-[#FFFAF2] py-4 pr-4">
                Rank
              </th>
              <th className="sticky top-0 z-10 border-b-2 border-[#211F20] bg-[#FFFAF2] py-4 pr-4">
                Player
              </th>
              <th className="sticky top-0 z-10 border-b-2 border-[#211F20] bg-[#FFFAF2] py-4 pr-4">
                Score
              </th>
              <th className="sticky top-0 z-10 border-b-2 border-[#211F20] bg-[#FFFAF2] py-4">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td className="py-12 text-center text-lg opacity-60" colSpan={4}>
                  No one has completed this quiz yet.
                </td>
              </tr>
            ) : (
              entries.map((entry, index) => {
                const rank = index + 1;
                const isFirst = rank === 1;
                const scorePercentage =
                  entry.max_points > 0
                    ? Math.round((entry.achieved_points / entry.max_points) * 100)
                    : 0;

                return (
                  <tr
                    className="border-b border-[#D7D0C4] last:border-b-0"
                    key={entry.user_id}
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
                        {scorePercentage}% correct
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
    </>
  );
}

function formatTime(seconds: number | undefined): string {
  if (seconds === undefined) {
    return "-";
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function formatScore(achieved: number, max: number): string {
  return `${Math.round(achieved)}/${Math.round(max)} pts`;
}

function getDisplayName(entry: LeaderboardEntryDTO): string {
  return entry.display_name || entry.email.split("@")[0];
}
