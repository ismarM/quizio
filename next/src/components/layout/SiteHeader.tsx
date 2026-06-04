import { UserRound } from "lucide-react";
import Link from "next/link";

import LogoutButton from "@/components/auth/LogoutButton";
import { routes } from "@/lib/navigation/routes";
import { getSessionUser } from "@/lib/auth/server-auth";

function getInitials(email?: string | null, displayName?: string | null) {
  const source = displayName || email || "U";
  return source.slice(0, 1).toUpperCase();
}

export async function SiteHeader() {
  const user = await getSessionUser();

  const isLoggedIn = Boolean(user);
  const isAdmin = user?.isAdmin

  return (
    <header className="q-container flex items-center justify-between border-b-2 border-transparent py-5 md:py-7">
      <Link
        href={routes.home}
        className="font-display text-5xl leading-none text-[#006E5A]"
      >
        Quizio
      </Link>

      <nav className="hidden items-center gap-8 text-[15px] leading-6 md:flex">
        <Link href={routes.quizzes} className="hover:text-[#FF3C38]">
          Explore quizzes
        </Link>
        <Link href="/#how-it-works" className="hover:text-[#FF3C38]">
          How it works
        </Link>
      </nav>

      <div className="hidden items-center gap-3 md:flex">
        {!isLoggedIn ? (
          <>
            <Link href={routes.login} className="q-button q-button-secondary">
              Log in
            </Link>
            <Link href={routes.login} className="q-button q-button-primary">
              Get started
            </Link>
          </>
        ) : (
          <>
            {isAdmin ? (
              <Link href={routes.admin} className="q-button q-button-secondary">
                Admin
              </Link>
            ) : null}

            <Link
              href={routes.dashboard}
              className="flex h-9 w-9 items-center justify-center border-2 border-[#211F20] bg-[#EBE4D8] font-display text-xl text-[#006E5A] hover:bg-[#006E5A] hover:text-[#FFFAF2]"
              title={user?.email ?? "Profile"}
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
            className="flex h-9 w-9 items-center justify-center border-2 border-[#211F20] bg-[#EBE4D8] font-display text-xl text-[#006E5A]"
            title={user?.email ?? "Profile"}
          >
            {getInitials(user?.email, user?.displayName)}
          </Link>
        ) : (
          <Link href={routes.login} className="q-button q-button-secondary">
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}