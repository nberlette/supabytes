import type React from "react";
import type { Metadata } from "next";

import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import {
  IBM_Plex_Mono,
  Merriweather,
  Space_Grotesk,
} from "next/font/google";

// Initialize fonts
const _spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});
const _ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});
const _merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Supabytes - Secure Serverless Cloud Storage",
  description: "Store, share, and access your files from anywhere with our globally-available edge network, built on Supabase.",
  keywords: [
    "cloud storage",
    "serverless storage",
    "secure file storage",
    "edge network",
    "Supabase storage",
    "file sharing",
    "data backup",
    "scalable storage solutions",
    "global file access",
    "encrypted storage",
  ],
  authors: [{ name: "Nicholas Berlette", url: "https://github.com/nberlette" }],
  openGraph: {
    title: "Supabytes - Secure Serverless Cloud Storage",
    description: "Store, share, and access your files from anywhere with our globally-available edge network, built on Supabase.",
    url: "https://supabytes.vercel.app",
    siteName: "Supabytes",
    images: [
      {
        url: "https://supabytes.vercel.app/og.png",
        width: 1280,
        height: 640,
        alt: "Supabytes Open Graph Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Supabytes - Secure Serverless Cloud Storage",
    description: "Store, share, and access your files from anywhere with our globally-available edge network, built on Supabase.",
    images: ["https://supabytes.vercel.app/og.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  publisher: "https://n.berlette.com",
  pinterest: {
    richPins: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          {children}
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
