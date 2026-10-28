import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./finance-theme.css";
import "./market-world.css";
export const metadata: Metadata = {
  title: "FINN — Your investment attention, focused",
  description:
    "A calmer investment desk. Follow your portfolio, explore price movements, and research companies through primary-source evidence.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#101f36",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
