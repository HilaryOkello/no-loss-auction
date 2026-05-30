"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { getAuction } from "@/lib/contract"
import { Auction } from "@/types/auction"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "@/components/auctions/StatusBadge"
import { CountdownTimer } from "@/components/auctions/CountdownTimer"
import { BidForm } from "@/components/auctions/BidForm"
import { FinalizeControls } from "@/components/auctions/FinalizeControls"

function formatAmount(amount: bigint): string {
  return (Number(amount) / 1_000_000).toFixed(2)
}

export default function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [auction, setAuction] = useState<Auction | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await getAuction(Number(id))
      setAuction(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return <div className="h-64 rounded-xl bg-muted animate-pulse" />
  }

  if (!auction) {
    return <p className="text-muted-foreground">Auction not found.</p>
  }

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-xl">{auction.title}</CardTitle>
            <StatusBadge status={auction.status} />
          </div>
          <CountdownTimer deadline={auction.deadline} />
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Min bid</p>
              <p className="font-semibold">{formatAmount(auction.min_bid)} tokens</p>
            </div>
            <div>
              <p className="text-muted-foreground">Highest bid</p>
              <p className="font-semibold">
                {auction.highest_bid > 0n
                  ? `${formatAmount(auction.highest_bid)} tokens`
                  : "No bids yet"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Seller</p>
              <p className="font-mono text-xs break-all">{auction.seller}</p>
            </div>
            {auction.highest_bidder && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Highest bidder</p>
                <p className="font-mono text-xs break-all">{auction.highest_bidder}</p>
              </div>
            )}
          </div>

          <Separator />

          <BidForm auction={auction} onSuccess={load} />
          <FinalizeControls auction={auction} onSuccess={load} />
        </CardContent>
      </Card>
    </div>
  )
}
