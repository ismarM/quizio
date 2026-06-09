import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { routes } from "@/lib/navigation/routes";

type StaticInfoSection = {
  title: string;
  body: string;
};

type StaticInfoPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: StaticInfoSection[];
};

export function StaticInfoPage({
  eyebrow,
  title,
  intro,
  sections,
}: StaticInfoPageProps) {
  return (
    <main className="q-page min-h-screen pb-20 md:pb-0">
      <SiteHeader />

      <section className="q-container pb-12 pt-6 md:pb-16 md:pt-10">
        <Link
          href={routes.home}
          className="q-button q-button-secondary mb-6 h-11 w-fit border-2 border-[#211F20] bg-[#FFFAF2] px-4 text-[16px] shadow-[3px_3px_0_#EBE4D8] transition hover:-translate-y-0.5 hover:bg-[#EBE4D8] hover:text-[#211F20]"
        >
          <ArrowLeft className="h-4 w-4" />
          Quizio
        </Link>

        <div className="max-w-3xl">
          <p className="mb-3 inline-flex bg-[#EBE4D8] px-3 py-1 font-display text-lg leading-none text-[#006E5A]">
            {eyebrow}
          </p>

          <h1 className="font-display text-[56px] leading-[0.9] text-[#211F20] md:text-[86px]">
            {title}
          </h1>

          <p className="mt-4 q-body text-[#211F20]">{intro}</p>
        </div>

        <Separator className="my-8 h-0.5 bg-[#211F20]" />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Card
              key={section.title}
              className="rounded-none border-2 border-[#211F20] bg-[#FFFDF8] shadow-[4px_4px_0_#EBE4D8]"
            >
              <CardHeader className="p-5 pb-3">
                <CardTitle className="font-display text-3xl font-normal leading-none text-[#211F20]">
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 q-body text-[#211F20]">
                {section.body}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <SiteFooter />
      <MobileBottomNav />
    </main>
  );
}
