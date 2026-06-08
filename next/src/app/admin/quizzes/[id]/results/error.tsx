"use client";

import { AdminRouteError } from "@/components/admin/AdminRouteError";

export default function AdminQuizResultsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AdminRouteError
      eyebrow="Admin results"
      message="Try again or go back to the admin panel."
      reset={reset}
    />
  );
}
