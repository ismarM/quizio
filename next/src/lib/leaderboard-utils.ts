import { LeaderboardEntryDTO } from "@/lib/types";

export function formatTime(seconds: number | undefined): string {
  if (seconds === undefined) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatScore(achieved: number, max: number): string {
  return `${Math.round(achieved)}/${Math.round(max)} pts`;
}

export function getDisplayName(entry: LeaderboardEntryDTO): string {
  if (entry.display_name) return entry.display_name;
  return entry.email.split("@")[0];
}
