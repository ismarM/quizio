import type { ReactNode } from "react";

export function DashboardSectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <span className="inline-flex bg-[var(--q-green-soft)] px-3 py-1 q-mini font-bold uppercase text-[var(--q-green)]">
        {eyebrow}
      </span>
      <h2 className="mt-3 font-display text-[38px] leading-none text-[var(--q-ink)] md:text-[44px]">
        {title}
      </h2>
    </div>
  );
}

export function DashboardEmptyState({
  description,
  icon,
  title,
}: {
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center md:flex-row md:text-left">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--q-green-soft)] text-[var(--q-green)]">
        {icon}
      </div>
      <div>
        <p className="text-[17px] font-semibold leading-6 text-[var(--q-ink)]">
          {title}
        </p>
        <p className="mt-1 text-[15px] leading-6 text-[var(--q-ink)]">
          {description}
        </p>
      </div>
    </div>
  );
}
