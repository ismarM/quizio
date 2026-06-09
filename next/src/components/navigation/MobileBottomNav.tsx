import {
  LayoutDashboard,
  ListChecks,
  LogIn,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { routes } from "@/lib/navigation/routes";
import { getSessionUser } from "@/lib/auth/server-auth";
import { cn } from "@/lib/utils";

type MobileNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export async function MobileBottomNav() {
  const t = await getTranslations("mobileNav");
  const user = await getSessionUser();

  const isLoggedIn = Boolean(user);
  const isAdmin = user?.isAdmin;

  const navItems: MobileNavItem[] = [
    {
      label: t("quizzes"),
      href: routes.quizzes,
      icon: ListChecks,
    },
    isLoggedIn
      ? {
          label: t("profile"),
          href: routes.dashboard,
          icon: UserRound,
        }
      : {
          label: t("login"),
          href: routes.login,
          icon: LogIn,
        },
  ];

  if (isAdmin) {
    navItems.push({
      label: t("admin"),
      href: routes.admin,
      icon: LayoutDashboard,
    });
  }

  return (
    <nav
      aria-label="Mobile navigation"
      className={cn(
        "fixed bottom-0 left-0 z-50 grid h-16 w-full border-t-2 border-[var(--q-border)] bg-[var(--q-surface-alt)] md:hidden",
        navItems.length === 3 ? "grid-cols-3" : "grid-cols-2"
      )}
    >
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={`${item.label}-${item.href}`}
            href={item.href}
            aria-label={item.label}
            className="flex min-w-0 flex-col items-center justify-center gap-1 px-2 q-mini text-[var(--q-ink)] transition hover:text-[var(--q-red)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[var(--q-focus)]"
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
