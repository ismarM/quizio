"use client";

import { AdminRouteError } from "@/components/admin/AdminRouteError";
import { useTranslations } from "next-intl";

export default function AdminQuizResultsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("admin.errors");

  return (
    <AdminRouteError
      eyebrow={t("resultsEyebrow")}
      message={t("resultsMessage")}
      reset={reset}
    />
  );
}
