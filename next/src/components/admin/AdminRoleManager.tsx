"use client";

import { type FormEvent, useState } from "react";
import { ShieldCheck, ShieldMinus, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { routes } from "@/lib/navigation/routes";

type RoleUpdateResponse = {
  signedOut: boolean;
  user?: {
    email: string;
    is_admin: boolean;
  };
};

async function updateRole(body: { email?: string; isAdmin: boolean }) {
  const response = await fetch("/api/admin/users/role", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? "Role update failed");
  }

  return payload as RoleUpdateResponse;
}

export function AdminRoleManager({ currentEmail }: { currentEmail: string }) {
  const t = useTranslations("admin.roleManager");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pendingAction, setPendingAction] = useState<"grant" | "revoke" | null>(
    null
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGrant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError(t("emailRequired"));
      setMessage(null);
      return;
    }

    setPendingAction("grant");
    setError(null);
    setMessage(null);

    try {
      const result = await updateRole({
        email: normalizedEmail,
        isAdmin: true,
      });
      setEmail("");
      setMessage(
        t("grantSuccess", {
          email: result.user?.email ?? normalizedEmail,
        })
      );
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : t("updateFailed")
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleSelfRevoke() {
    setPendingAction("revoke");
    setError(null);
    setMessage(null);

    try {
      const result = await updateRole({ isAdmin: false });
      if (result.signedOut) {
        window.location.assign(routes.login);
        return;
      }
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : t("updateFailed")
      );
      setPendingAction(null);
    }
  }

  const isPending = pendingAction !== null;

  return (
    <section className="mb-6 border-2 border-[#211F20] bg-[#FFFDF8] p-4 shadow-[6px_6px_0_#EBE4D8] md:p-5">
      <div className="mb-4 flex flex-col gap-3 border-b-2 border-[#EBE4D8] pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-2 inline-flex bg-[#DDECE8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
            {t("eyebrow")}
          </p>
          <h2 className="font-display text-[34px] leading-none text-[#211F20]">
            {t("title")}
          </h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#211F20]">
            {t("description")}
          </p>
        </div>

        <div className="flex items-center gap-2 border-2 border-[#D7D0C4] bg-[#FFFAF2] px-3 py-2 q-mini text-[#006E5A]">
          <ShieldCheck className="h-4 w-4" />
          <span className="break-all">{currentEmail || t("currentAdmin")}</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form className="grid gap-3" onSubmit={handleGrant}>
          <label className="grid gap-2" htmlFor="admin-role-email">
            <span className="q-mini font-bold uppercase text-[#006E5A]">
              {t("emailLabel")}
            </span>
            <Input
              className="h-11 rounded-none border-2 border-[#211F20] bg-[#FFFAF2] text-[15px] shadow-none focus-visible:border-[#006E5A] focus-visible:ring-0"
              disabled={isPending}
              id="admin-role-email"
              placeholder={t("emailPlaceholder")}
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError(null);
                setMessage(null);
              }}
            />
          </label>

          <Button
            className="q-button q-button-primary h-11 w-full rounded-none border-[#006E5A] bg-[#006E5A] text-[16px] transition hover:-translate-y-0.5 hover:bg-[#005647] sm:w-fit"
            disabled={isPending}
            type="submit"
          >
            <UserPlus className="h-4 w-4" />
            {pendingAction === "grant" ? t("granting") : t("grantAdmin")}
          </Button>
        </form>

        <div className="grid gap-3 border-2 border-[#D7D0C4] bg-[#FFFAF2] p-4">
          <div>
            <p className="q-mini font-bold uppercase text-[#FF3C38]">
              {t("selfRevokeTitle")}
            </p>
            <p className="mt-2 text-[13px] leading-5 text-[#211F20]">
              {t("selfRevokeDescription")}
            </p>
          </div>

          <Button
            className="q-button q-button-primary h-11 rounded-none border-[#FF3C38] bg-[#FF3C38] text-[16px] transition hover:-translate-y-0.5 hover:bg-[#D92F2B]"
            disabled={isPending}
            onClick={handleSelfRevoke}
            type="button"
          >
            <ShieldMinus className="h-4 w-4" />
            {pendingAction === "revoke" ? t("revoking") : t("revokeSelf")}
          </Button>
        </div>
      </div>

      {message ? (
        <p className="mt-4 border-2 border-[#006E5A] bg-[#DDECE8] p-3 q-mini font-bold uppercase text-[#006E5A]">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 border-2 border-[#FF3C38] bg-[#FFFDF8] p-3 q-mini font-bold uppercase text-[#FF3C38]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
