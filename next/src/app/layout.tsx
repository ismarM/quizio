import { cn } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import Script from "next/script";
import { CookieDisclaimer } from "@/components/layout/CookieDisclaimer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Quizio",
  title: {
    default: "Quizio",
    template: "%s | Quizio",
  },
  description:
    "Create, publish and solve focused quiz challenges with clean results tracking.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/quizio-icon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/icons/quizio-icon.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Quizio",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFAF2" },
    { media: "(prefers-color-scheme: dark)", color: "#11100E" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body className="flex min-h-full flex-col">
        <Script id="quizio-theme-init" strategy="beforeInteractive">
          {`try{var theme=window.localStorage.getItem("quizio-theme");document.documentElement.classList.toggle("dark",theme==="dark");}catch(_){}`}
        </Script>
        <NextIntlClientProvider messages={messages}>
          {children}
          <CookieDisclaimer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
