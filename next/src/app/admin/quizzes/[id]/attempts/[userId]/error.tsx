"use client";

import { AdminRouteError } from "@/components/admin/AdminRouteError";
import { useTranslations } from "next-intl";

export default function AdminAttemptReviewError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("admin.errors");

  return (
    <AdminRouteError
      eyebrow={t("attemptReviewEyebrow")}
      message={t("attemptReviewMessage")}
      reset={reset}
    />
  );
}
