import Link from "next/link";
import { Trophy } from "lucide-react";

import { quizLeaderboardPreview } from "@/lib/mock-data";
import { routes } from "@/lib/routes";

type QuizLeaderboardMiniProps = {
  quizId: number;
};

export function QuizLeaderboardMini({ quizId }: QuizLeaderboardMiniProps) {
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
            <h2 className="font-display text-[48px] leading-none text-[#211F20]">
              Top results
            </h2>
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
          {quizLeaderboardPreview.map((item) => (
            <div
              key={item.rank}
              className="grid grid-cols-[48px_1fr_auto] items-center border-b border-[#D7D0C4] py-3 last:border-b-0"
            >
              <span
                className={[
                  "flex h-9 w-9 items-center justify-center font-display text-xl",
                  item.rank === 1
                    ? "bg-[#FF3C38] text-[#FFFAF2]"
                    : "bg-[#EBE4D8] text-[#211F20]",
                ].join(" ")}
              >
                {item.rank}
              </span>

              <span className="q-body text-[#211F20]">{item.name}</span>

              <span className="font-display text-2xl text-[#006E5A]">
                {item.score}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}