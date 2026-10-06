import type { Metadata, Viewport } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#0066AB",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Smart Note & Mindmap",
  description: "Enterprise-Grade Local-First Visual Thinking & Project Management PWA",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${notoSans.variable} h-full antialiased`}
      dir="ltr"
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
