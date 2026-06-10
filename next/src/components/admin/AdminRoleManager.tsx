"use client";

import { type FormEvent, useEffect, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ShieldCheck,
  ShieldMinus,
  UserPlus,
  X,
} from "lucide-react";
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
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"grant" | "revoke" | null>(
    null
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const panelId = "admin-role-manager-panel";
  const isPending = pendingAction !== null;

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

  useEffect(() => {
    if (!confirmOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        setConfirmOpen(false);
      }
    }

    document.body.classList.add("overflow-hidden");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("overflow-hidden");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [confirmOpen, isPending]);

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
      setConfirmOpen(false);
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : t("updateFailed")
      );
      setConfirmOpen(false);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="mb-6 overflow-hidden border-2 border-[#211F20] bg-[#FFFDF8] shadow-[6px_6px_0_#EBE4D8]">
      <button
        aria-controls={panelId}
        aria-expanded={expanded}
        className="flex w-full flex-col gap-4 p-4 text-left transition hover:bg-[#FFFAF2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#006E5A] md:flex-row md:items-center md:justify-between md:p-5"
        onClick={() => setExpanded((value) => !value)}
        type="button"
      >
        <div className="min-w-0">
          <span className="mb-2 inline-flex bg-[#DDECE8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
            {t("eyebrow")}
          </span>
          <div className="flex min-w-0 items-center gap-3">
            <h2 className="font-display text-[32px] leading-none text-[#211F20] sm:text-[34px]">
              {t("title")}
            </h2>
            <ChevronDown
              className={[
                "h-5 w-5 shrink-0 text-[#211F20] transition",
                expanded ? "rotate-180" : "",
              ].join(" ")}
            />
          </div>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#211F20]">
            {t("description")}
          </p>
        </div>

        <div className="flex min-h-11 w-full items-center gap-2 border-2 border-[#D7D0C4] bg-[#FFFAF2] px-3 py-2 q-mini text-[#006E5A] md:w-auto md:max-w-[320px]">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span className="min-w-0 break-all">
            {currentEmail || t("currentAdmin")}
          </span>
        </div>
      </button>

      {expanded ? (
        <div
          className="animate-in fade-in slide-in-from-top-2 border-t-2 border-[#EBE4D8] p-4 duration-200 md:p-5"
          id={panelId}
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
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
                className="q-button q-button-primary h-12 w-full rounded-none border-[#006E5A] bg-[#006E5A] text-[16px] transition hover:-translate-y-0.5 hover:bg-[#005647] sm:w-fit"
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
                className="q-button q-button-primary h-12 w-full rounded-none border-[#FF3C38] bg-[#FF3C38] text-[16px] transition hover:-translate-y-0.5 hover:bg-[#D92F2B]"
                disabled={isPending}
                onClick={() => setConfirmOpen(true)}
                type="button"
              >
                <ShieldMinus className="h-4 w-4" />
                {t("revokeSelf")}
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
        </div>
      ) : null}

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-[1000] grid place-items-end bg-[#211F20]/45 p-3 sm:place-items-center"
          onClick={() => {
            if (!isPending) {
              setConfirmOpen(false);
            }
          }}
        >
          <section
            aria-labelledby="admin-revoke-confirm-title"
            aria-modal="true"
            className="w-full max-w-[440px] border-2 border-[#211F20] bg-[#FFFDF8] text-[#211F20] shadow-[6px_6px_0_#211F20] animate-in fade-in slide-in-from-bottom-4 duration-200"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b-2 border-[#211F20] bg-[#FFFAF2] p-4">
              <div className="flex min-w-0 gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#FF3C38] bg-[#FFFDF8] text-[#FF3C38]">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="q-mini font-bold uppercase text-[#FF3C38]">
                    {t("confirmEyebrow")}
                  </p>
                  <h3
                    className="mt-1 font-display text-[30px] leading-none text-[#211F20]"
                    id="admin-revoke-confirm-title"
                  >
                    {t("confirmTitle")}
                  </h3>
                </div>
              </div>

              <button
                aria-label={t("cancel")}
                className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#211F20] bg-[#FFFAF2] text-[#211F20] transition hover:-translate-y-0.5 hover:bg-[#EBE4D8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006E5A]"
                disabled={isPending}
                onClick={() => setConfirmOpen(false)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 p-4">
              <p className="text-[14px] leading-6 text-[#211F20]">
                {t("confirmBody", {
                  email: currentEmail || t("currentAdmin"),
                })}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  className="q-button q-button-secondary h-12 rounded-none border-2 border-[#211F20] bg-[#FFFAF2] text-[16px] transition hover:-translate-y-0.5 hover:bg-[#EBE4D8] hover:text-[#211F20]"
                  disabled={isPending}
                  onClick={() => setConfirmOpen(false)}
                  type="button"
                  variant="outline"
                >
                  {t("cancel")}
                </Button>

                <Button
                  className="q-button q-button-primary h-12 rounded-none border-[#FF3C38] bg-[#FF3C38] text-[16px] transition hover:-translate-y-0.5 hover:bg-[#D92F2B]"
                  disabled={isPending}
                  onClick={handleSelfRevoke}
                  type="button"
                >
                  <ShieldMinus className="h-4 w-4" />
                  {pendingAction === "revoke"
                    ? t("revoking")
                    : t("confirmRevoke")}
                </Button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
