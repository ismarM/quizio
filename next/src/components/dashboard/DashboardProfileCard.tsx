"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Languages, Pencil, Play, Save, SunMoon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { proxyFetchJson } from "@/lib/api/proxy-client";
import { routes } from "@/lib/navigation/routes";
import type { UserResponse } from "@/lib/types";

type DashboardProfileCardProps = {
  displayName: string;
  email: string;
  initial: string;
  isAdmin: boolean;
  language: number;
  theme: number;
};

const languageLabels: Record<number, string> = {
  0: "English",
  1: "Slovenian",
};

const themeLabels: Record<number, string> = {
  0: "Light",
  1: "Dark",
};

function normalizeTheme(value: number) {
  return value === 1 ? 1 : 0;
}

function normalizeLanguage(value: number) {
  return value === 1 ? 1 : 0;
}

function applyTheme(value: number, persist = false) {
  const isDark = value === 1;
  document.documentElement.classList.toggle("dark", isDark);

  if (persist) {
    try {
      window.localStorage.setItem("quizio-theme", isDark ? "dark" : "light");
    } catch {
      // The saved backend preference is still the source of truth.
    }
  }
}

export function DashboardProfileCard({
  displayName,
  email,
  initial,
  isAdmin,
  language,
  theme,
}: DashboardProfileCardProps) {
  const router = useRouter();
  const initialTheme = normalizeTheme(theme);
  const initialLanguage = normalizeLanguage(language);

  const [savedName, setSavedName] = useState(displayName);
  const [name, setName] = useState(displayName);
  const [savedTheme, setSavedTheme] = useState(initialTheme);
  const [selectedTheme, setSelectedTheme] = useState(initialTheme);
  const [savedLanguage, setSavedLanguage] = useState(initialLanguage);
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  const trimmedName = name.trim();
  const isDirty =
    trimmedName !== savedName ||
    selectedTheme !== savedTheme ||
    selectedLanguage !== savedLanguage;

  useEffect(() => {
    applyTheme(selectedTheme);
  }, [selectedTheme]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmedName) {
      setStatus("error");
      setMessage("Username is required.");
      return;
    }

    setStatus("saving");
    setMessage(null);

    try {
      let latestResponse: UserResponse | null = null;

      if (trimmedName !== savedName) {
        latestResponse = await proxyFetchJson<UserResponse>(
          "/users/me/display-name",
          {
            method: "PATCH",
            body: { display_name: trimmedName },
          }
        );
      }

      if (
        selectedTheme !== savedTheme ||
        selectedLanguage !== savedLanguage
      ) {
        latestResponse = await proxyFetchJson<UserResponse>(
          "/users/me/preferences",
          {
            method: "PATCH",
            body: {
              language: selectedLanguage,
              theme: selectedTheme,
            },
          }
        );
      }

      const updatedUser = latestResponse?.user;
      const nextName = updatedUser?.display_name ?? trimmedName;
      const nextTheme = normalizeTheme(updatedUser?.theme ?? selectedTheme);
      const nextLanguage = normalizeLanguage(
        updatedUser?.language ?? selectedLanguage
      );

      setSavedName(nextName);
      setName(nextName);
      setSavedTheme(nextTheme);
      setSelectedTheme(nextTheme);
      setSavedLanguage(nextLanguage);
      setSelectedLanguage(nextLanguage);
      setStatus("saved");
      setMessage("Profile updated.");
      applyTheme(nextTheme, true);
      router.refresh();
    } catch (error) {
      applyTheme(savedTheme);
      setSelectedTheme(savedTheme);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Update failed.");
    }
  }

  return (
    <section className="border-2 border-[var(--q-muted-strong)] bg-[var(--q-surface)] p-5 shadow-[6px_6px_0_var(--q-shadow)] md:p-6">
      <div className="grid gap-5 sm:grid-cols-[116px_minmax(0,1fr)] sm:items-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-[var(--q-border)] bg-[var(--q-green-soft)] font-display text-[62px] leading-none text-[var(--q-green)]">
          {initial}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-[42px] leading-none text-[var(--q-ink)]">
              {savedName}
            </h2>
            {isAdmin ? (
              <span className="bg-[var(--q-green)] px-2 py-1 q-mini font-bold uppercase text-[var(--q-on-accent)]">
                Admin
              </span>
            ) : null}
          </div>
          <p className="mt-2 break-all text-[15px] leading-6 text-[var(--q-ink)]">
            {email}
          </p>
        </div>
      </div>

      <Separator className="my-5 h-[2px] bg-[var(--q-muted-strong)]" />

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div>
          <label
            className="mb-2 flex items-center gap-2 q-mini font-bold uppercase text-[var(--q-green)]"
            htmlFor="dashboard-username"
          >
            <Pencil className="h-4 w-4" />
            Username
          </label>
          <Input
            id="dashboard-username"
            className="h-11 rounded-none border-2 border-[var(--q-border)] bg-[var(--q-surface-alt)] text-[15px] shadow-none focus-visible:border-[var(--q-focus)] focus-visible:ring-0"
            maxLength={45}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setStatus("idle");
              setMessage(null);
            }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2" htmlFor="dashboard-theme">
            <span className="flex items-center gap-2 q-mini font-bold uppercase text-[var(--q-green)]">
              <SunMoon className="h-4 w-4" />
              Theme
            </span>
            <select
              id="dashboard-theme"
              className="h-11 rounded-none border-2 border-[var(--q-border)] bg-[var(--q-surface-alt)] px-3 text-[15px] font-semibold text-[var(--q-ink)] outline-none transition focus:border-[var(--q-focus)]"
              value={selectedTheme}
              onChange={(event) => {
                setSelectedTheme(Number(event.target.value));
                setStatus("idle");
                setMessage(null);
              }}
            >
              {Object.entries(themeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2" htmlFor="dashboard-language">
            <span className="flex items-center gap-2 q-mini font-bold uppercase text-[var(--q-green)]">
              <Languages className="h-4 w-4" />
              Language
            </span>
            <select
              id="dashboard-language"
              className="h-11 rounded-none border-2 border-[var(--q-border)] bg-[var(--q-surface-alt)] px-3 text-[15px] font-semibold text-[var(--q-ink)] outline-none transition focus:border-[var(--q-focus)]"
              value={selectedLanguage}
              onChange={(event) => {
                setSelectedLanguage(Number(event.target.value));
                setStatus("idle");
                setMessage(null);
              }}
            >
              {Object.entries(languageLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <Button
          className="q-button q-button-secondary h-11 rounded-none border-2 border-[var(--q-border)] bg-[var(--q-surface-alt)] text-[16px] transition hover:-translate-y-0.5 hover:bg-[var(--q-muted)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!isDirty || status === "saving"}
          type="submit"
          variant="outline"
        >
          <Save className="h-4 w-4" />
          {status === "saving" ? "Saving..." : "Save profile"}
        </Button>

        {message ? (
          <p
            className={[
              "q-mini",
              status === "error" ? "text-[var(--q-red)]" : "text-[var(--q-green)]",
            ].join(" ")}
          >
            {message}
          </p>
        ) : null}
      </form>

      <Separator className="my-5 h-[2px] bg-[var(--q-muted-strong)]" />

      <div className="grid gap-3">
        <Button
          asChild
          className="q-button q-button-primary h-12 rounded-none border-[var(--q-red)] bg-[var(--q-red)] text-[18px] transition hover:-translate-y-0.5 hover:bg-[var(--q-red-hover)]"
        >
          <Link href={routes.quizzes}>
            <Play className="h-4 w-4" />
            Explore quizzes
          </Link>
        </Button>

        <Button
          asChild
          className="q-button q-button-secondary h-12 rounded-none border-2 border-[var(--q-border)] bg-[var(--q-surface-alt)] text-[18px] transition hover:-translate-y-0.5 hover:bg-[var(--q-muted)]"
          variant="outline"
        >
          <Link href={routes.home}>
            <Home className="h-4 w-4" />
            Back home
          </Link>
        </Button>
      </div>
    </section>
  );
}
