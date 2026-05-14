import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ecfeff,_#ffffff_50%,_#f1f5f9)]">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-6 py-16">
        <header className="space-y-6">
          <Badge
            variant="secondary"
            className="w-fit bg-emerald-50 text-[0.65rem] uppercase tracking-[0.3em] text-emerald-700"
          >
            Firebase Auth
          </Badge>
          <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            Quizio authentication playground.
          </h1>
          <p className="max-w-2xl text-lg text-slate-600">
            Email/password and Google sign-in are configured with Firebase.
            Session cookies power the protected routes on the server.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild className="rounded-full bg-emerald-600 hover:bg-emerald-700">
              <Link href="/login">Go to login</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/dashboard">View dashboard</Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <Card className="border-border/60 bg-card/90 shadow-sm">
            <CardHeader>
              <Badge variant="outline" className="w-fit text-[0.6rem] uppercase">
                Email
              </Badge>
              <CardTitle>Email + password login</CardTitle>
              <CardDescription>
                Sign in with credentials stored in Firebase Authentication.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-border/60 bg-card/90 shadow-sm">
            <CardHeader>
              <Badge variant="outline" className="w-fit text-[0.6rem] uppercase">
                Google
              </Badge>
              <CardTitle>Google OAuth popup</CardTitle>
              <CardDescription>
                Uses Firebase Auth Google provider with a popup flow.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-border/60 bg-card/90 shadow-sm">
            <CardHeader>
              <Badge variant="outline" className="w-fit text-[0.6rem] uppercase">
                Server
              </Badge>
              <CardTitle>Backend-verified sessions</CardTitle>
              <CardDescription>
                The backend verifies ID tokens and stores session cookies.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        <Card className="border-border/60 bg-card/80 shadow-sm">
          <CardHeader>
            <CardTitle>Protected routes</CardTitle>
            <CardDescription>
              Session cookie checks happen on the server before rendering.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row">
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">Dashboard (login)</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin">Admin (email)</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
