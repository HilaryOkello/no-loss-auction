import Link from "next/link"
import { ConnectWallet } from "@/components/wallet/ConnectWallet"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/auctions" className="font-bold text-lg tracking-tight">
          BidStar
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/auctions">
            <Button variant="ghost" size="sm">
              Auctions
            </Button>
          </Link>
          <Link href="/create">
            <Button size="sm">+ Create</Button>
          </Link>
          <ConnectWallet />
        </div>
      </nav>
    </header>
  )
}
