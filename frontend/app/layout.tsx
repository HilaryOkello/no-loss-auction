import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { WalletProvider } from "@/components/wallet/WalletProvider"
import { Navbar } from "@/components/layout/Navbar"
import { NetworkBanner } from "@/components/layout/NetworkBanner"
import { Toaster } from "@/components/ui/sonner"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })

export const metadata: Metadata = {
  title: "BidStar — No-Loss Auctions on Stellar",
  description: "Decentralized auctions on Stellar. Losing bidders are always refunded.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen bg-background text-foreground">
        <WalletProvider>
          <NetworkBanner />
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            {children}
          </main>
          <Toaster richColors position="bottom-right" />
        </WalletProvider>
      </body>
    </html>
  )
}
