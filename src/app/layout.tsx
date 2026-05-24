import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MythRogue — Roguelike Dungeon Crawler",
  description: "Procedural roguelike dungeon crawler powered by 8 AI agents. Every run is different.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
