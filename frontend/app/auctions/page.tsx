import Link from "next/link"
import { AuctionList } from "@/components/auctions/AuctionList"
import { Button } from "@/components/ui/button"

export default function AuctionsPage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center sm:text-left flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Live Auctions
          </h1>
          <p className="mt-2 text-slate-500 text-sm sm:text-base max-w-md">
            No-loss bidding on Stellar — get outbid and your tokens come right back.
          </p>
        </div>
        <Link href="/create" className="shrink-0">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto">
            + Create Auction
          </Button>
        </Link>
      </div>

      <AuctionList />
    </div>
  )
}
