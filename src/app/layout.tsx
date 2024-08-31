import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
export const runtime = "edge";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MeetUp",
  description: "Fast and efficient disposable video calls",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-full h-full w-full`}>{children}</body>
    </html>
  );
}
