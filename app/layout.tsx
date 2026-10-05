import type { Metadata } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import "@/components/birthy/motion.css";

// Served by Next from the app's own origin. Only three weights are shipped.
const birthyFont = M_PLUS_Rounded_1c({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  // Let Unicode-range matching load the glyph subsets each screen actually uses.
  preload: false,
  variable: "--font-birthy",
  fallback: ["Hiragino Maru Gothic ProN", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Birthy | 誕生日でつながる、やさしい場所。",
  description: "普段あまり話さない相手にも、誕生日なら気軽にお祝いを。あなたのペースで気持ちを届ける場所です。",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className={birthyFont.variable} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
