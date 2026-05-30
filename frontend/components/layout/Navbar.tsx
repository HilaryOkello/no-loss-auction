import Link from "next/link"
import { ConnectWallet } from "@/components/wallet/ConnectWallet"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/auctions" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            B
          </div>
          <span className="font-bold text-slate-900 text-lg hidden sm:block">BidStar</span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link href="/auctions">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-900 hidden sm:inline-flex"
            >
              Auctions
            </Button>
          </Link>
          <Link href="/create">
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            >
              <span className="hidden sm:inline">+ Create Auction</span>
              <span className="sm:hidden">+ Create</span>
            </Button>
          </Link>
          <ConnectWallet />
        </div>
      </nav>
    </header>
  )
}
