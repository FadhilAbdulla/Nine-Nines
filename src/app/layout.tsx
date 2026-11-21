import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nine Nines — build a software company",
  description: "A browser story game. Start in a garage, ship an app, grow your traffic, hire a team, buy tools, build an office, and take your company public.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f1420" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
