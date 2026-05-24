import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Clock3,
  Eye,
  FilePlus2,
  ImagePlus,
  ListChecks,
  LockKeyhole,
  Pencil,
  Save,
  ShieldCheck,
} from "lucide-react";

import type { AdminQuizListItem } from "@/lib/mock-data";
import { adminQuizQuestions } from "@/lib/mock-data";
import { routes } from "@/lib/routes";

type AdminQuizEditorProps = {
  quiz: AdminQuizListItem;
};

export function AdminQuizEditor({ quiz }: AdminQuizEditorProps) {
  const isPublished = quiz.status === "published";

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_360px]">
      <section className="border-2 border-[#211F20] bg-[#FFFAF2] p-5 shadow-[8px_8px_0_#EBE4D8] md:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={routes.adminQuizzes}
            className="inline-flex items-center gap-2 q-mini text-[#211F20] hover:text-[#FF3C38]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to quizzes
          </Link>

          <StatusBadge status={quiz.status} />
        </div>

        <div className="grid gap-5">
          <div>
            <p className="mb-3 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
              Quiz settings
            </p>

            <h2 className="font-display text-[52px] leading-[0.9] text-[#211F20] md:text-[72px]">
              {quiz.title}
            </h2>

            <p className="mt-4 max-w-2xl q-body text-[#211F20]">
              {quiz.description}
            </p>
          </div>

          {isPublished ? (
            <div className="border-2 border-[#006E5A] bg-[#DDECE8] p-4">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-1 h-5 w-5 text-[#006E5A]" />
                <div>
                  <p className="font-display text-2xl leading-none text-[#211F20]">
                    Published quiz is locked
                  </p>
                  <p className="mt-1 q-body text-[#211F20]">
                    Editing questions and answers is disabled after publishing to
                    protect existing attempts and results.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <ReadOnlyField label="Title" value={quiz.title} />
            <ReadOnlyField label="Category" value={quiz.category} />
            <ReadOnlyField label="Time limit" value={`${quiz.timeLimitMinutes} minutes`} />
            <ReadOnlyField label="Status" value={quiz.status} />
          </div>

          <div>
            <label className="block">
              <span className="mb-2 block font-display text-2xl leading-none text-[#211F20]">
                Description
              </span>

              <textarea
                className="min-h-[120px] w-full border-2 border-[#211F20] bg-[#FFFAF2] p-3 q-body outline-none focus:border-[#FF3C38] disabled:opacity-60"
                defaultValue={quiz.description}
                disabled={isPublished}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <button
              type="button"
              className={[
                "q-button q-button-primary border-[#FF3C38] bg-[#FF3C38]",
                isPublished ? "pointer-events-none opacity-50" : "",
              ].join(" ")}
            >
              <Save className="h-4 w-4" />
              Save changes
            </button>

            <Link href={routes.quizDetail(quiz.id)} className="q-button q-button-secondary">
              <Eye className="h-4 w-4" />
              Preview
            </Link>

            <button
              type="button"
              className={[
                "q-button",
                isPublished
                  ? "q-button-disabled"
                  : "q-button-secondary",
              ].join(" ")}
            >
              <ShieldCheck className="h-4 w-4" />
              {isPublished ? "Published" : "Publish"}
            </button>
          </div>
        </div>
      </section>

      <aside className="grid content-start gap-5">
        <section className="border-2 border-[#211F20] bg-[#EBE4D8] p-5 md:p-6">
          <ListChecks className="mb-5 h-10 w-10 text-[#006E5A]" />

          <p className="font-display text-[42px] leading-[0.9] text-[#211F20]">
            Quiz summary
          </p>

          <div className="my-5 h-[2px] bg-[#211F20]" />

          <div className="grid gap-3">
            <SummaryItem label="Questions" value={`${quiz.questionCount}`} />
            <SummaryItem label="Attempts" value={`${quiz.attempts}`} />
            <SummaryItem label="Time limit" value={`${quiz.timeLimitMinutes} min`} />
            <SummaryItem label="Created" value={quiz.createdAt} />
          </div>
        </section>

        <section className="border-2 border-[#211F20] bg-[#006E5A] p-5 text-[#FFFAF2] md:p-6">
          <AlertTriangle className="mb-5 h-10 w-10" />

          <p className="font-display text-[38px] leading-[0.9]">
            Publish only when ready.
          </p>

          <p className="mt-4 q-body">
            Once published, this quiz should be considered stable. Use draft
            state for editing questions and answers.
          </p>
        </section>
      </aside>

      <section className="border-2 border-[#211F20] bg-[#FFFAF2] p-5 md:col-span-2 md:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-2 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
              Questions
            </p>

            <h2 className="font-display text-[48px] leading-none text-[#211F20]">
              Question list
            </h2>
          </div>

          <button
            type="button"
            className={[
              "q-button q-button-primary border-[#FF3C38] bg-[#FF3C38]",
              isPublished ? "pointer-events-none opacity-50" : "",
            ].join(" ")}
          >
            <FilePlus2 className="h-4 w-4" />
            Add question
          </button>
        </div>

        <div className="h-[2px] bg-[#211F20]" />

        <div className="mt-4 grid gap-3">
          {adminQuizQuestions.map((question, index) => (
            <article
              key={question.id}
              className="grid gap-3 border border-[#D7D0C4] p-4 md:grid-cols-[48px_1fr_auto]"
            >
              <span className="flex h-10 w-10 items-center justify-center bg-[#EBE4D8] font-display text-xl text-[#211F20]">
                {index + 1}
              </span>

              <div>
                <p className="font-display text-2xl leading-none text-[#211F20]">
                  {question.title}
                </p>
                <p className="mt-1 q-mini text-[#8F8F8F]">
                  {question.type} · {question.points} points · {question.answers} answers
                </p>
              </div>

              <div className="flex gap-2 md:justify-end">
                <button
                  type="button"
                  className={[
                    "q-button q-button-secondary",
                    isPublished ? "pointer-events-none opacity-50" : "",
                  ].join(" ")}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>

                <button
                  type="button"
                  className={[
                    "q-button q-button-secondary",
                    isPublished ? "pointer-events-none opacity-50" : "",
                  ].join(" ")}
                >
                  <ImagePlus className="h-4 w-4" />
                  Media
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-2 block font-display text-2xl leading-none text-[#211F20]">
        {label}
      </span>
      <input className="q-input h-12" value={value} readOnly />
    </label>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#211F20] pb-3 last:border-b-0">
      <p className="q-mini text-[#211F20]">{label}</p>
      <p className="font-display text-3xl leading-none text-[#211F20]">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: AdminQuizListItem["status"] }) {
  const classes = {
    draft: "bg-[#EBE4D8] text-[#211F20]",
    published: "bg-[#006E5A] text-[#FFFAF2]",
    archived: "bg-[#8F8F8F] text-[#FFFAF2]",
  };

  return (
    <span className={`px-2 py-1 text-[12px] leading-4 ${classes[status]}`}>
      {status}
    </span>
  );
}