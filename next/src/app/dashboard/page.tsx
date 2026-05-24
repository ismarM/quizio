import Link from "next/link";

import LogoutButton from "@/components/auth/LogoutButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { requireAuth } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-emerald-50">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <Badge
              variant="secondary"
              className="w-fit bg-emerald-50 text-[0.65rem] uppercase tracking-[0.3em] text-emerald-700"
            >
              Dashboard
            </Badge>
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold text-slate-900">
                Welcome back{user.displayName ? `, ${user.displayName}` : ""}.
              </h1>
              <p className="text-sm text-slate-500">
                Signed in as {user.email ?? "unknown"}
              </p>
            </div>
          </div>
          <LogoutButton />
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border/60 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>Admin area</CardTitle>
              <CardDescription>
                Requires email &quot;tets@maaail.csssf&quot;.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin">Open admin</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>Back home</CardTitle>
              <CardDescription>Return to the landing page.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">Go home</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
