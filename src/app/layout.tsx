import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope, Newsreader } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Motion } from "@/components/motion/Motion";
import { ScopeTrace } from "@/components/nav/ScopeTrace";
import { NetSearch } from "@/components/nav/NetSearch";
import { buildSearchIndex } from "@/components/nav/searchIndex";
import { theme, themeCssVars } from "@/lib/themes";
import { profile } from "@/content/profile";
import "./globals.css";

const serif = Newsreader({ subsets: ["latin"], axes: ["opsz"], style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

/** Full public URL, e.g. https://jashwanthbamidi.dev, set by the deploy workflow */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  title: { default: `${profile.name} — hardware and embedded engineering`, template: `%s · ${profile.name}` },
  description:
    "Jashwanth Bamidi, Computer Engineering at UIUC. PCB design and board bring-up, embedded systems, FPGA and signal processing work.",
  robots: { index: true, follow: true },
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
};

export const viewport: Viewport = { themeColor: theme.ground };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${serif.variable} ${sans.variable} ${mono.variable}`} style={themeCssVars(theme) as React.CSSProperties}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <ScopeTrace />
        <NetSearch index={buildSearchIndex()} />
        <Motion />
      </body>
    </html>
  );
}
