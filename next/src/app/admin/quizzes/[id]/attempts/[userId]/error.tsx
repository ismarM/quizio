"use client";

import { AdminRouteError } from "@/components/admin/AdminRouteError";

export default function AdminAttemptReviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AdminRouteError
      eyebrow="Attempt review"
      message={
        error.message ||
        "The attempt details are temporarily unavailable. Try again or go back to the admin panel."
      }
      reset={reset}
    />
  );
}
