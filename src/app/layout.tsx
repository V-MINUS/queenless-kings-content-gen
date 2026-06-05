import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QK Content Generator",
  description: "AI-powered social content generator for Queenless Kings",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
