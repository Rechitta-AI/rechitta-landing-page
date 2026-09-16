import { Playfair_Display, JetBrains_Mono } from 'next/font/google';

/*
 * The design system's display and code faces (design.md). Inter, its UI face,
 * is loaded beside these in the root layout, which puts `designFontVariables`
 * on <html> so `--font-playfair` and `--font-jetbrains` resolve everywhere.
 */
const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
});

export const designFontVariables = `${playfair.variable} ${jetbrains.variable}`;

export const FONT_DISPLAY = "var(--font-playfair), 'Playfair Display', serif";
export const FONT_BODY = "var(--font-inter), 'Inter', sans-serif";
export const FONT_CODE = "var(--font-jetbrains), 'JetBrains Mono', monospace";
