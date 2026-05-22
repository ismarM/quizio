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

export const dynamic = "force-dynamic";


export default async function AdminPage() {

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-amber-50 to-emerald-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <Badge
              variant="secondary"
              className="w-fit bg-amber-100 text-[0.65rem] uppercase tracking-[0.3em] text-amber-900"
            >
              Admin
            </Badge>
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold text-slate-900">
                Restricted access confirmed.
              </h1>
              <p className="text-sm text-slate-600">
                Email: 
              </p>
            </div>
          </div>
          <LogoutButton />
        </header>

        <Card className="border-border/60 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Admin access rule</CardTitle>
            <CardDescription>
              Only the configured email can reach this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This page requires a Firebase Auth email that matches{" "}
              <span className="font-semibold text-slate-800"></span>.
            </p>
          </CardContent>
        </Card>

        <Button asChild variant="outline" className="w-fit">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
