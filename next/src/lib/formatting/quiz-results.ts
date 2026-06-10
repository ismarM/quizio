export function formatDurationClock(
  totalSeconds: number | undefined,
  fallback?: string
) {
  if (typeof totalSeconds !== "number") {
    return fallback ?? "-";
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.max(0, totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatNumberCompact(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatScoreFraction(score: number, maxScore: number) {
  if (maxScore <= 0) {
    return "0/0";
  }

  return `${formatNumberCompact(score)}/${formatNumberCompact(maxScore)}`;
}

export function formatDateTimeLabel({
  fallback,
  locale,
  options,
  unknownLabel,
  value,
}: {
  fallback: string;
  locale: string;
  options?: Intl.DateTimeFormatOptions;
  unknownLabel: string;
  value?: string;
}) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return unknownLabel;
  }

  return new Intl.DateTimeFormat(locale, options).format(date);
}
