import type { Metadata } from "next";
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
  title: "Rechitta — One source of truth",
  description:
    "Live developer inventory, translated into conversation — so every broker and every buyer speaks the same language.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${monument.variable} ${spaceMono.variable} antialiased`}
    >
      <body suppressHydrationWarning>
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
