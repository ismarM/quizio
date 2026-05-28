import {
  Home,
  LayoutDashboard,
  ListChecks,
  LogIn,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { routes } from "@/lib/routes";
import { getSessionUser } from "@/lib/serverAuth";

export async function MobileBottomNav() {
  const user = await getSessionUser();

  const isLoggedIn = Boolean(user);
  const isAdmin = user?.isAdmin

  const navItems = [
    {
      label: "Home",
      href: routes.home,
      icon: Home,
    },
    {
      label: "Quizzes",
      href: routes.quizzes,
      icon: ListChecks,
    },
    isAdmin
      ? {
          label: "Admin",
          href: routes.admin,
          icon: LayoutDashboard,
        }
      : {
          label: "Dashboard",
          href: isLoggedIn ? routes.dashboard : routes.login,
          icon: LayoutDashboard,
        },
    isLoggedIn
      ? {
          label: "Profile",
          href: routes.dashboard,
          icon: UserRound,
        }
      : {
          label: "Login",
          href: routes.login,
          icon: LogIn,
        },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-50 grid h-16 w-full grid-cols-4 border-t-2 border-[#211F20] bg-[#FFFAF2] md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={`${item.label}-${item.href}`}
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 q-mini text-[#211F20] hover:text-[#FF3C38]"
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}