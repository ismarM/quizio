import Link from "next/link";
import { ArrowRight, Code2, MessageCircle, Mail, Play } from "lucide-react";

import { routes } from "@/lib/routes";

export function SiteFooter() {
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
            Learn. Challenge. Grow. Quizzes for curious minds.
          </p>
        </div>

        <FooterColumn
          title="Navigate"
          links={[
            { label: "Explore quizzes", href: routes.quizzes },
            { label: "How it works", href: "/#how-it-works" },
            { label: "Leaderboard", href: routes.leaderboard },
          ]}
        />

        <FooterColumn
          title="Info"
          links={[
            { label: "About us", href: "/about" },
            { label: "Help center", href: "/help" },
            { label: "Terms of service", href: "/terms" },
            { label: "Privacy policy", href: "/privacy" },
          ]}
        />

        <div>
          <h3 className="font-display text-2xl text-[#211F20]">Connect</h3>
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
          <h3 className="font-display text-2xl text-[#211F20]">Newsletter</h3>
          <p className="mt-2 q-body">Get quiz tips and updates.</p>

          <div className="mt-4 grid grid-cols-[1fr_44px]">
            <input
              type="email"
              placeholder="Enter your email"
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
          © 2026 Quizio. All rights reserved.
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