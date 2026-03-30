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
  title: "Hyr — Get Discovered by Top Tech Companies",
  description:
    "Build a verified skill profile in 15 minutes. Employers on Hyr browse engineers by actual skills — not resumes. DevOps, Frontend, Backend & QA.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://hyr.pk"),
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-hyr.png", type: "image/png" },
    ],
    apple: "/favicon-hyr.png",
  },
  openGraph: {
    title: "Hyr — Get Discovered by Top Tech Companies",
    description:
      "Build a verified skill profile. Employers browse you by domain scores, trust signals, and engineering type — no applications needed.",
    siteName: "Hyr",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Hyr — Where companies discover verified engineers.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hyr — Get Discovered by Top Tech Companies",
    description:
      "Build a verified skill profile in 15 minutes. Companies on Hyr find engineers by actual skills — not resumes.",
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
