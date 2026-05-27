import Link from "next/link";
import { Check, Clock3 } from "lucide-react";

import { routes } from "@/lib/routes";

const answerOptions = [
  { label: "Earth", selected: false },
  { label: "Mars", selected: true },
  { label: "Jupiter", selected: false },
  { label: "Venus", selected: false },
];

export function HeroSection() {
  return (
    <section className="q-container grid gap-10 pb-12 pt-8 md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-16 md:pb-16 md:pt-14">
      <div>

        <h1 className="font-display text-[72px] leading-[0.88] text-[#211F20] sm:text-[84px] md:text-[118px]">
          Create.
          <span className="block text-[#FF3C38]">Challenge.</span>
        </h1>

        <p className="mt-6 max-w-xl q-body text-[#211F20]">
          Build timed quizzes, publish them to users, collect answers and show
          results in a clean quiz experience.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={routes.login} className="q-button q-button-primary">
            Get started
          </Link>

          <Link href={routes.quizzes} className="q-button q-button-secondary">
            Explore quizzes
          </Link>
        </div>
      </div>

      <div className="relative">
        <div className="absolute -right-4 -top-4 hidden h-24 w-24 border-2 border-[#EBE4D8] md:block" />
        <div className="absolute -bottom-4 -left-4 hidden h-20 w-20 bg-[#EBE4D8] md:block" />

        <div className="relative border-2 border-[#211F20] bg-[#FFFAF2] p-5 shadow-[12px_12px_0_#EBE4D8] md:p-7">
          <div className="mb-5 flex items-center justify-between">
            <span className="q-mini text-[#8F8F8F]">Question 4 / 20</span>

            <div className="flex h-9 items-center gap-2 border-2 border-[#211F20] bg-[#FFFAF2] px-3 font-display text-base text-[#211F20]">
              <Clock3 className="h-4 w-4" />
              12:45
            </div>
          </div>

          <div className="mb-6 h-2 bg-[#EBE4D8]">
            <div className="h-full w-1/3 bg-[#FF3C38]" />
          </div>

          <div className="mb-6">
            <p className="q-mini mb-2 text-[#006E5A]">Science Quiz</p>
            <h2 className="font-display text-[40px] leading-[1] text-[#211F20]">
              Which planet is known as the Red Planet?
            </h2>
          </div>

          <div className="grid gap-3">
            {answerOptions.map((option) => (
              <div
                key={option.label}
                className={[
                  "flex h-14 items-center gap-3 border-2 px-4",
                  option.selected
                    ? "border-[#FF3C38] bg-[#FFFAF2]"
                    : "border-[#EBE4D8] bg-[#FFFAF2]",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-6 w-6 items-center justify-center border-2",
                    option.selected
                      ? "border-[#FF3C38] bg-[#FF3C38]"
                      : "border-[#8F8F8F]",
                  ].join(" ")}
                >
                  {option.selected ? (
                    <Check className="h-4 w-4 text-[#FFFAF2]" strokeWidth={3} />
                  ) : null}
                </span>

                <span className="q-body text-[#211F20]">{option.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button className="q-button q-button-secondary">Previous</button>
            <button className="q-button q-button-primary bg-[#FF3C38] border-[#FF3C38]">
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}