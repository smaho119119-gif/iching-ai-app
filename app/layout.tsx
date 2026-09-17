import type { Metadata } from "next";
import "./globals.css";
import "./readable-mobile.css";

export const metadata: Metadata = {
  title: "易の余白 — 変化のなかに、考える時間を。",
  description: "64卦の古典的な知恵を、いまの自分を見つめるための小さな問いに。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
