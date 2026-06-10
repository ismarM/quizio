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

type SiteHeaderProps = {
  showPublicNavLinks?: boolean;
};

export async function SiteHeader({
  showPublicNavLinks = true,
}: SiteHeaderProps = {}) {
  const t = await getTranslations("nav");
  const user = await getSessionUser();

  const isLoggedIn = Boolean(user);
  const isAdmin = user?.isAdmin;
  const logoHref = isLoggedIn ? routes.quizzes : routes.home;

  return (
    <header className="q-container flex items-center justify-between border-b-2 border-transparent py-5 md:py-7">
      <div className="flex items-center gap-6 md:gap-8">
        <Link
          href={logoHref}
          className="font-display text-5xl leading-none text-[var(--q-green)]"
        >
          Quizio
        </Link>
        {!isLoggedIn && showPublicNavLinks ? (
          <Link href={routes.quizzes} className="hover:text-[var(--q-red)]">
            {t("exploreQuizzes")}
          </Link>
        ) : null}
      </div>

      <nav className="hidden items-center gap-8 text-[15px] leading-6 text-[var(--q-ink)] md:flex">
        {!isLoggedIn && showPublicNavLinks ? (
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
              className="flex h-11 w-11 items-center justify-center border-2 border-[var(--q-border)] bg-[var(--q-muted)] font-display text-xl text-[var(--q-green)] transition hover:-translate-y-0.5 hover:bg-[var(--q-green)] hover:text-[var(--q-on-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--q-focus)]"
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
            className="flex h-11 w-11 items-center justify-center border-2 border-[var(--q-border)] bg-[var(--q-muted)] font-display text-xl text-[var(--q-green)] transition hover:-translate-y-0.5 hover:bg-[var(--q-green)] hover:text-[var(--q-on-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--q-focus)]"
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
