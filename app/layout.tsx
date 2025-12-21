import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"
import { Space_Grotesk as V0_Font_Space_Grotesk, IBM_Plex_Mono as V0_Font_IBM_Plex_Mono, Merriweather as V0_Font_Merriweather } from 'next/font/google'

// Initialize fonts
const _spaceGrotesk = V0_Font_Space_Grotesk({ subsets: ['latin'], weight: ["300","400","500","600","700"] })
const _ibmPlexMono = V0_Font_IBM_Plex_Mono({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700"] })
const _merriweather = V0_Font_Merriweather({ subsets: ['latin'], weight: ["300","400","500","600","700","800","900"] })

export const metadata: Metadata = {
  title: "CloudVault - Secure File Storage",
  description: "Store, share, and access your files from anywhere",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
