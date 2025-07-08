import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Mouna",
  description: "Modern nanny time tracking and family management app",
  metadataBase: new URL("https://mouna.app"),
  openGraph: {
    title: "Mouna",
    description: "Modern nanny time tracking and family management app",
    url: "https://mouna.app",
    siteName: "Mouna",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mouna",
    description: "Modern nanny time tracking and family management app",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://mouna.app",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
