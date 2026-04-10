import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LenisProvider } from "@/components/animation/LenisProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { CommandPalette } from "@/components/CommandPalette";
import { JsonLd } from "@/components/JsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mineralwater.com";

export const metadata: Metadata = {
  title: {
    default: "MineralWater — Find Your Perfect Water",
    template: "%s — MineralWater",
  },
  description:
    "Compare mineral water brands by mineral content. Track your hydration. Find the best water for your health goals.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "MineralWater",
    title: "MineralWater — Find Your Perfect Water",
    description:
      "Compare mineral water brands by mineral content. Track your hydration. Find the best water for your health goals.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MineralWater — Find Your Perfect Water",
    description:
      "Compare mineral water brands by mineral content. Track your hydration. Find the best water for your health goals.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "MineralWater",
            url: siteUrl,
            logo: `${siteUrl}/favicon.ico`,
            description:
              "Compare mineral water brands by mineral content. Track your hydration.",
            sameAs: [],
          }}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "MineralWater",
            url: siteUrl,
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: `${siteUrl}/brands?q={search_term_string}`,
              },
              "query-input": "required name=search_term_string",
            },
          }}
        />
        <LenisProvider>
          <Header />
          <main className="flex-1 pt-16 pb-16 md:pb-0">{children}</main>
          <Footer />
          <BottomNav />
          <CommandPalette />
        </LenisProvider>
      </body>
    </html>
  );
}
