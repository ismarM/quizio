"use client";

import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { auth, googleProvider } from "@/lib/clients/firebase-client";
import { routes } from "@/lib/navigation/routes";

type LoginFormProps = {
  reason?: string;
  next?: string;
};

export default function LoginForm({ reason, next }: LoginFormProps) {
  const t = useTranslations("login");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isRegisterMode = mode === "register";
  const errorTitle = isRegisterMode
    ? t("registrationFailed")
    : t("signInFailed");
  const reasonMessage =
    reason === "unauthorized" ? t("unauthorizedReason") : null;

  const startSession = async (idToken: string) => {
    const response = await fetch("/api/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? t("unableToStartSession"));
    }
  };

  const goAfterLogin = () => {
    const safeNext = next && next.startsWith("/") ? next : routes.quizzes;
    router.push(safeNext);
    router.refresh();
  };

  const handleEmailSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await result.user.getIdToken();

      await startSession(idToken);
      goAfterLogin();
    } catch (err) {
      setError(getErrorMessage(err, t("genericError")));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);

    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      await startSession(idToken);
      goAfterLogin();
    } catch (err) {
      setError(getErrorMessage(err, t("genericError")));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {

      await setPersistence(auth, browserLocalPersistence);
      const result = await createUserWithEmailAndPassword(
        auth,
        registerEmail,
        registerPassword
      );

      const idToken = await result.user.getIdToken();

      await startSession(idToken);
      goAfterLogin();
    } catch (err) {
      setError(getErrorMessage(err, t("genericError")));
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (nextMode: "login" | "register") => {
    setError(null);
    setMode(nextMode);
  }

  return (
    <main className="q-page min-h-screen">
      <div className="q-container flex min-h-screen flex-col py-6">
        <header className="flex items-center justify-between">
          <Link
            href={routes.home}
            className="font-display text-5xl leading-none text-[#006E5A]"
          >
            Quizio
          </Link>

          <Link href={routes.home} className="q-button q-button-secondary">
            {t("backHome")}
          </Link>
        </header>

        <section className="grid flex-1 gap-10 py-12 md:grid-cols-[1fr_0.92fr] md:items-center md:py-16">
          <div>
            <p className="mb-4 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
              {t("pageLabel")}
            </p>

            <h1 className="font-display text-[62px] leading-[0.9] text-[#211F20] md:text-[96px]">
              {t("heading1")}
              <span className="block text-[#FF3C38]">{t("heading2")}</span>
            </h1>

            <p className="mt-6 max-w-xl q-body text-[#211F20]">
              {t("subtitle")}
            </p>

            <div className="mt-8 grid gap-3 md:max-w-lg">
              <InfoRow text={t("info1")} />
              <InfoRow text={t("info2")} />
              <InfoRow text={t("info3")} />
            </div>
          </div>

          <div className="border-2 border-[#211F20] bg-[#FFFAF2] p-5 shadow-[10px_10px_0_#EBE4D8] md:p-6">
            <div className="mb-5">
              <h2 className="font-display text-[42px] leading-none text-[#211F20]">
                {isRegisterMode ? t("createAccount") : t("welcomeBack")}
              </h2>
              <p className="mt-2 q-body text-[#211F20]">
                {isRegisterMode
                  ? t("registerWithEmail")
                  : t("signInWithEmail")}
              </p>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleModeChange("login")}
                disabled={isLoading}
                className={[
                  "q-button w-full",
                  !isRegisterMode
                    ? "q-button-primary border-[#FF3C38] bg-[#FF3C38]"
                    : "q-button-secondary",
                ].join(" ")}
              >
                {t("signIn")}
              </button>

              <button
                type="button"
                onClick={() => handleModeChange("register")}
                disabled={isLoading}
                className={[
                  "q-button w-full",
                  isRegisterMode
                    ? "q-button-primary border-[#FF3C38] bg-[#FF3C38]"
                    : "q-button-secondary",
                ].join(" ")}
              >
                {t("register")}
              </button>
            </div>

            {reasonMessage ? (
              <div className="mb-5 border-2 border-[#FF3C38] bg-[#FFFAF2] p-4">
                <p className="font-display text-2xl text-[#FF3C38]">
                  {t("accessRestricted")}
                </p>
                <p className="q-body text-[#211F20]">{reasonMessage}</p>
              </div>
            ) : null}

            {error ? (
              <div className="mb-5 border-2 border-[#FF3C38] bg-[#FFFAF2] p-4">
                <p className="font-display text-2xl text-[#FF3C38]">
                  {errorTitle}
                </p>
                <p className="q-body text-[#211F20]">{error}</p>
              </div>
            ) : null}

            {isRegisterMode ? (
              <form onSubmit={handleEmailRegister} className="grid gap-4">
                <FormField
                  id="register-email"
                  label={t("emailLabel")}
                  type="email"
                  value={registerEmail}
                  onChange={setRegisterEmail}
                  placeholder={t("emailPlaceholder")}
                  icon="email"
                />

                <FormField
                  id="register-password"
                  label={t("passwordLabel")}
                  type="password"
                  value={registerPassword}
                  onChange={setRegisterPassword}
                  placeholder={t("passwordPlaceholderNew")}
                  icon="password"
                />

                <button
                  type="submit"
                  className="q-button q-button-primary mt-2 w-full border-[#FF3C38] bg-[#FF3C38]"
                  disabled={isLoading}
                >
                  {isLoading ? t("creatingAccount") : t("createAccountButton")}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="grid gap-5">
                <form onSubmit={handleEmailSignIn} className="grid gap-4">
                  <FormField
                    id="email"
                    label={t("emailLabel")}
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder={t("emailPlaceholder")}
                    icon="email"
                  />

                  <FormField
                    id="password"
                    label={t("passwordLabel")}
                    type="password"
                    value={password}
                    onChange={setPassword}
                    placeholder={t("passwordPlaceholder")}
                    icon="password"
                  />

                  <button
                    type="submit"
                    className="q-button q-button-primary mt-2 w-full border-[#FF3C38] bg-[#FF3C38]"
                    disabled={isLoading}
                  >
                    {isLoading ? t("signingIn") : t("signInButton")}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                <div className="flex items-center gap-3">
                  <div className="h-[2px] flex-1 bg-[#EBE4D8]" />
                  <span className="q-mini text-[#8F8F8F]">{t("or")}</span>
                  <div className="h-[2px] flex-1 bg-[#EBE4D8]" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="q-button q-button-secondary w-full"
                  disabled={isLoading}
                >
                  {t("continueWithGoogle")}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center border-2 border-[#211F20] bg-[#EBE4D8]">
        <CheckCircle2 className="h-5 w-5 text-[#006E5A]" />
      </span>
      <p className="q-body text-[#211F20]">{text}</p>
    </div>
  )
};

function FormField({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  icon,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: "email" | "password";
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block font-display text-xl text-[#211F20]">
        {label}
      </span>

      <span className="relative block">
        {icon === "email" ? (
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F8F8F]" />
        ) : (
          <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F8F8F]" />
        )}

        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required
          className="q-input pl-10"
        />
      </span>
    </label>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

