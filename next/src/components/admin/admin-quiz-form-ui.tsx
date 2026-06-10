import type { ReactNode } from "react";

import { isImageUrl } from "@/lib/uploads/images";

export function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="block">
      <span className="mb-2 block font-display text-2xl leading-none text-[#211F20]">
        {label}
        {required ? <span className="text-[#FF3C38]"> *</span> : null}
      </span>
      {children}
    </div>
  );
}

export function ImagePreview({
  emptyLabel,
  label,
  value,
}: {
  emptyLabel: string;
  label: string;
  value: string;
}) {
  if (!isImageUrl(value)) {
    return (
      <div className="flex min-h-[132px] items-center justify-center border-2 border-[#D7D0C4] bg-[#EBE4D8] p-4 text-center q-mini text-[#211F20]">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div
      aria-label={label}
      className="min-h-[132px] border-2 border-[#211F20] bg-[#EBE4D8] bg-contain bg-center bg-no-repeat"
      role="img"
      style={{ backgroundImage: `url("${value}")` }}
    />
  );
}

export function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-[#211F20] pb-3 last:border-b-0">
      <p className="q-mini text-[#211F20]">{label}</p>
      <p className="font-display text-3xl leading-none text-[#211F20]">
        {value}
      </p>
    </div>
  );
}
