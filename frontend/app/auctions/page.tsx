import { AuctionList } from "@/components/auctions/AuctionList"

export default function AuctionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Live Auctions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          All losing bids are automatically refunded — no risk.
        </p>
      </div>
      <AuctionList />
    </div>
  )
}
