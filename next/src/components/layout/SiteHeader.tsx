import { UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import LogoutButton from "@/components/auth/LogoutButton";
import { routes } from "@/lib/navigation/routes";
import { getSessionUser } from "@/lib/auth/server-auth";

function getInitials(email?: string | null, displayName?: string | null) {
  const source = displayName || email || "U";
  return source.slice(0, 1).toUpperCase();
}

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const user = await getSessionUser();

  const isLoggedIn = Boolean(user);
  const isAdmin = user?.isAdmin;

  return (
    <header className="q-container flex items-center justify-between border-b-2 border-transparent py-5 md:py-7">
      <Link
        href={routes.home}
        className="font-display text-5xl leading-none text-[var(--q-green)]"
      >
        Quizio
      </Link>

      <nav className="hidden items-center gap-8 text-[15px] leading-6 text-[var(--q-ink)] md:flex">
        <Link href={routes.quizzes} className="hover:text-[var(--q-red)]">
          {t("exploreQuizzes")}
        </Link>
        {!isLoggedIn ? (
          <Link href="/#how-it-works" className="hover:text-[var(--q-red)]">
            {t("howItWorks")}
          </Link>
        ) : null}
      </nav>

      <div className="hidden items-center gap-3 md:flex">
        {!isLoggedIn ? (
          <>
            <Link href={routes.login} className="q-button q-button-secondary">
              {t("logIn")}
            </Link>
            <Link href={routes.login} className="q-button q-button-primary">
              {t("getStarted")}
            </Link>
          </>
        ) : (
          <>
            {isAdmin ? (
              <Link href={routes.admin} className="q-button q-button-secondary">
                {t("admin")}
              </Link>
            ) : null}

            <Link
              href={routes.dashboard}
              className="flex h-9 w-9 items-center justify-center border-2 border-[var(--q-border)] bg-[var(--q-muted)] font-display text-xl text-[var(--q-green)] hover:bg-[var(--q-green)] hover:text-[var(--q-on-accent)]"
              title={user?.email ?? t("profile")}
            >
              {user ? (
                getInitials(user.email, user.displayName)
              ) : (
                <UserRound className="h-5 w-5" />
              )}
            </Link>

            <LogoutButton />
          </>
        )}
      </div>

      <div className="md:hidden">
        {isLoggedIn ? (
          <Link
            href={routes.dashboard}
            className="flex h-9 w-9 items-center justify-center border-2 border-[var(--q-border)] bg-[var(--q-muted)] font-display text-xl text-[var(--q-green)]"
            title={user?.email ?? t("profile")}
          >
            {getInitials(user?.email, user?.displayName)}
          </Link>
        ) : (
          <Link href={routes.login} className="q-button q-button-secondary">
            {t("logIn")}
          </Link>
        )}
      </div>
    </header>
  );
}
