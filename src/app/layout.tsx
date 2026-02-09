import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RaketH Clone - AI Voice Cloning Platform",
  description: "Transform text into realistic speech with RaketH Clone. Create professional voice recordings from text using advanced AI voice cloning technology.",
  keywords: ["RaketH Clone", "Text to Speech", "TTS", "AI Voice", "Voice Cloning", "Next.js", "TypeScript"],
  authors: [{ name: "RaketH Team" }],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/images/logo.png",
  },
  openGraph: {
    title: "RaketH Clone",
    description: "AI-powered voice generation and cloning platform",
    url: "https://rakehclone.com",
    siteName: "RaketH Clone",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RaketH Clone",
    description: "Transform text into realistic speech with AI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
