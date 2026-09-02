import type { Metadata } from "next";
import Script from "next/script";
import SmoothScroller from "@/components/SmoothScroller";
import { DemoModalProvider } from "@/contexts/DemoModalContext";
import AppHeader from "@/components/AppHeader";
import InteractiveDemoModal from "@/components/InteractiveDemoModal";
import "./globals.css";

import localFont from "next/font/local";
import { Space_Mono } from "next/font/google";

const monument = localFont({
  src: [
    {
      path: "../../public/fonts/MonumentExtended-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/MonumentExtended-Ultrabold.otf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-monument",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Rechitta — AI Real Estate Platform in Dubai",
  description:
    "Next-gen AI for Dubai real estate. Discover properties faster with 24/7 support, real-time insights, and always-accurate listings.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${monument.variable} ${spaceMono.variable} antialiased`}
    >
      <head>
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-552HKQHS');
            `,
          }}
        />
        <Script
          id="schema-org"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Rechitta",
  "url": "https://www.rechitta.com",
  "sameAs": [
    "https://www.linkedin.com/company/rechitta/",
    "https://www.instagram.com/rechitta.ai/"
  ],
  "foundingDate": "2025",
  "foundingLocation": {
    "@type": "Place",
    "name": "Dubai, United Arab Emirates"
  },
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Dubai",
    "addressCountry": "AE"
  }
}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-552HKQHS"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        <DemoModalProvider>
          <SmoothScroller>
            <AppHeader />
            <InteractiveDemoModal />
            {children}
          </SmoothScroller>
        </DemoModalProvider>
      </body>
    </html>
  );
}
