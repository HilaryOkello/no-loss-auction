import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { WalletProvider } from "@/components/wallet/WalletProvider"
import { Navbar } from "@/components/layout/Navbar"
import { NetworkBanner } from "@/components/layout/NetworkBanner"
import { Toaster } from "@/components/ui/sonner"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BidStar — No-Loss Auction on Stellar",
  description:
    "Decentralized auctions where losing bidders are always refunded.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${geist.className} min-h-screen bg-background`}>
        <WalletProvider>
          <Navbar />
          <NetworkBanner />
          <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
          <Toaster richColors position="bottom-right" />
        </WalletProvider>
      </body>
    </html>
  )
}
