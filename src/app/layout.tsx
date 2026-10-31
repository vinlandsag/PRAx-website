import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { ThemeSync } from "@/components/layout/ThemeSync";

export const metadata: Metadata = {
  title: { default: "PRAX", template: "%s · PRAX" },
  description: "A workspace for meaningful work, learning and community.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link
          rel="preload"
          href="/fonts/InterVariable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <ThemeSync />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
