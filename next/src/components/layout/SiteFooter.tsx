import Link from "next/link";
import { ArrowRight, Code2, MessageCircle, Mail, Play } from "lucide-react";
import { useTranslations } from "next-intl";

import { routes } from "@/lib/navigation/routes";

export function SiteFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-[#D7D0C4] bg-[#F4EFE6]">
      <div className="q-container grid gap-8 py-8 md:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_1.2fr] md:py-10">
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
            { label: t("links.howItWorks"), href: "/#how-it-works" },
            { label: t("links.leaderboard"), href: routes.leaderboard },
          ]}
        />

        <FooterColumn
          title={t("info")}
          links={[
            { label: t("links.about"), href: "/about" },
            { label: t("links.help"), href: "/help" },
            { label: t("links.terms"), href: "/terms" },
            { label: t("links.privacy"), href: "/privacy" },
          ]}
        />

        <div>
          <h3 className="font-display text-2xl text-[#211F20]">{t("connect")}</h3>
          <p className="mt-2 q-body">hello@quizio.com</p>

          <div className="mt-4 flex gap-2">
            <FooterIcon href="#" label="Code">
              <Code2 className="h-4 w-4" />
            </FooterIcon>
            <FooterIcon href="mailto:hello@quizio.com" label="Email">
              <Mail className="h-4 w-4" />
            </FooterIcon>
            <FooterIcon href="#" label="Instagram">
              <MessageCircle className="h-4 w-4" />
            </FooterIcon>
            <FooterIcon href="#" label="YouTube">
              <Play className="h-4 w-4" />
            </FooterIcon>
          </div>
        </div>

        <div>
          <h3 className="font-display text-2xl text-[#211F20]">{t("newsletter")}</h3>
          <p className="mt-2 q-body">{t("newsletterSubtitle")}</p>

          <div className="mt-4 grid grid-cols-[1fr_44px]">
            <input
              type="email"
              placeholder={t("emailPlaceholder")}
              className="q-input h-11 border-r-0 bg-[#FFFAF2]"
            />
            <button className="flex h-11 items-center justify-center bg-[#006E5A] text-[#FFFAF2]">
              <ArrowRight className="h-5 w-5" />
            </button>
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
  return (
    <a
      href={href}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center border border-[#211F20] bg-[#FFFAF2] hover:bg-[#211F20] hover:text-[#FFFAF2]"
    >
      {children}
    </a>
  );
}
