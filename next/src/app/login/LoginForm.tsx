"use client";

import {
    browserLocalPersistence,
    createUserWithEmailAndPassword,
    setPersistence,
    signInWithEmailAndPassword,
    signInWithPopup,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { auth, googleProvider } from "@/lib/firebaseClient";

type LoginFormProps = {
  reason?: string;
};

const reasonMessages: Record<string, string> = {
  unauthorized: "Your account is not allowed to access that page.",
};

export default function LoginForm({ reason }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isRegisterMode = mode === "register";
  const errorTitle = isRegisterMode ? "Registration failed" : "Sign-in failed";

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
      throw new Error(payload?.error ?? "Unable to start session.");
    }
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
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
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
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
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
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (nextMode: "login" | "register") => {
    setError(null);
    setMode(nextMode);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ecfeff,_#ffffff_55%,_#fef9c3)]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-16 md:flex-row md:items-center">
        <div className="flex-1 space-y-6">
          <Badge
            variant="secondary"
            className="w-fit bg-emerald-50 text-[0.65rem] uppercase tracking-[0.3em] text-emerald-700"
          >
            Quizio Auth
          </Badge>
          <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            Sign in to keep your quiz progress synced.
          </h1>
          <p className="text-lg text-slate-600">
            Use email and password or Google to continue. Admin access requires
            the email &quot;tets@maaail.csssf&quot;.
          </p>
          <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Protected routes</CardTitle>
              <CardDescription>Session-backed access rules.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Dashboard</span>
                <Badge variant="outline">Login required</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Admin</span>
                <Badge variant="secondary" className="bg-amber-100 text-amber-900">
                  tets@maaail.csssf
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="w-full max-w-md border-border/60 bg-card/90 shadow-xl backdrop-blur">
          <CardHeader className="space-y-3">
            <div className="space-y-1">
              <CardTitle className="text-2xl">
                {isRegisterMode ? "Create your account" : "Welcome back"}
              </CardTitle>
              <CardDescription>
                {isRegisterMode
                  ? "Sign up with email and password to start."
                  : "Use the same credentials you created in Firebase Auth."}
              </CardDescription>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                size="sm"
                variant={isRegisterMode ? "outline" : "default"}
                onClick={() => handleModeChange("login")}
                disabled={isLoading}
              >
                Sign in
              </Button>
              <Button
                type="button"
                size="sm"
                variant={isRegisterMode ? "default" : "outline"}
                onClick={() => handleModeChange("register")}
                disabled={isLoading}
              >
                Register
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {reason && reasonMessages[reason] && (
              <Alert>
                <AlertTitle>Access restricted</AlertTitle>
                <AlertDescription>{reasonMessages[reason]}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTitle>{errorTitle}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isRegisterMode ? (
              <form onSubmit={handleEmailRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerEmail}
                    onChange={(event) => setRegisterEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerPassword}
                    onChange={(event) => setRegisterPassword(event.target.value)}
                    placeholder="Create a password"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </form>
            ) : (
              <>
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in with email"}
                  </Button>
                </form>

                <div className="relative">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                    or
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  className="w-full"
                  disabled={isLoading}
                >
                  Continue with Google
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
