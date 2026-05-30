import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Auction } from "@/types/auction"
import { StatusBadge } from "./StatusBadge"
import { CountdownTimer } from "./CountdownTimer"

function formatAmount(amount: bigint): string {
  return (Number(amount) / 1_000_000).toFixed(2)
}

export function AuctionCard({ auction }: { auction: Auction }) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug line-clamp-2">
            {auction.title}
          </CardTitle>
          <StatusBadge status={auction.status} />
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
        <div className="flex justify-between">
          <span>Min bid</span>
          <span className="text-foreground font-medium">
            {formatAmount(auction.min_bid)} tokens
          </span>
        </div>
        <div className="flex justify-between">
          <span>Highest bid</span>
          <span className="text-foreground font-medium">
            {auction.highest_bid > 0n
              ? `${formatAmount(auction.highest_bid)} tokens`
              : "—"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>Deadline</span>
          <CountdownTimer deadline={auction.deadline} />
        </div>
        <div className="truncate text-xs">
          Seller: {auction.seller.slice(0, 8)}…
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <Link href={`/auctions/${auction.auction_id}`} className="w-full">
          <Button variant="outline" size="sm" className="w-full">
            View Auction
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
