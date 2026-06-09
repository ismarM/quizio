import Link from "next/link";
import { Code2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

import { routes } from "@/lib/navigation/routes";

const contactEmail = "guiziomaster@gmail.com";
const githubUrl = "https://github.com/ismarM/quizio";

export function SiteFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-[#D7D0C4] bg-[#F4EFE6]">
      <div className="q-container grid gap-8 py-8 md:grid-cols-[1.4fr_0.8fr_0.9fr_0.9fr] md:py-10">
        <div>
          <Link
            href={routes.home}
            className="font-display text-5xl leading-none text-[#006E5A]"
          >
            Quizio
          </Link>

          <p className="mt-3 max-w-xs q-body text-[#211F20]">
            {t("tagline")}
          </p>
        </div>

        <FooterColumn
          title={t("navigate")}
          links={[
            { label: t("links.exploreQuizzes"), href: routes.quizzes },
          ]}
        />

        <FooterColumn
          title={t("info")}
          links={[
            { label: t("links.about"), href: routes.about },
            { label: t("links.terms"), href: routes.terms },
            { label: t("links.privacy"), href: routes.privacy },
          ]}
        />

        <div>
          <h3 className="font-display text-2xl text-[#211F20]">{t("connect")}</h3>
          <p className="mt-2 q-body">{contactEmail}</p>

          <div className="mt-4 flex gap-2">
            <FooterIcon href={githubUrl} label="GitHub">
              <Code2 className="h-4 w-4" />
            </FooterIcon>
            <FooterIcon href={`mailto:${contactEmail}`} label="Email">
              <Mail className="h-4 w-4" />
            </FooterIcon>
          </div>
        </div>
      </div>

      <div className="border-t border-[#D7D0C4]">
        <div className="q-container py-4 q-mini text-[#211F20]">
          {t("copyright")}
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="font-display text-2xl text-[#211F20]">{title}</h3>

      <div className="mt-3 grid gap-2 q-body">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-[#FF3C38]">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function FooterIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  const isExternal = href.startsWith("http");

  return (
    <a
      href={href}
      aria-label={label}
      rel={isExternal ? "noreferrer" : undefined}
      target={isExternal ? "_blank" : undefined}
      className="flex h-11 w-11 items-center justify-center border-2 border-[#211F20] bg-[#FFFAF2] transition hover:-translate-y-0.5 hover:bg-[#211F20] hover:text-[#FFFAF2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006E5A]"
    >
      {children}
    </a>
  );
}
