import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hyr — Prove Your DevOps Skills",
  description:
    "Free 15-minute DevOps assessment across 13 domains. Get a verified skill profile and get hired faster.",
  metadataBase: new URL("https://hyr-snowy.vercel.app"),
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-hyr.png", type: "image/png" },
    ],
    apple: "/favicon-hyr.png",
  },
  openGraph: {
    title: "Hyr — Prove Your DevOps Skills",
    description:
      "Take a free 15-minute assessment. Get a verified skill profile across 13 DevOps domains. Show employers exactly what you can do.",
    siteName: "Hyr",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Hyr — Prove Your DevOps Skills. Get Hired Faster.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hyr — Prove Your DevOps Skills",
    description:
      "Free 15-minute DevOps assessment across 13 domains. Get hired faster.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
