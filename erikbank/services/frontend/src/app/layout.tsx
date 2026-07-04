import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ErikBank Pmt",
  description: "ErikBank payment portal powered by Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
