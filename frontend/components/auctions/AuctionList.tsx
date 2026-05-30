"use client"

import { useEffect, useState } from "react"
import { getAllAuctions } from "@/lib/contract"
import { Auction } from "@/types/auction"
import { AuctionCard } from "./AuctionCard"

export function AuctionList() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const data = await getAllAuctions()
      setAuctions(data.reverse())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 10_000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-52 rounded-xl bg-muted animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (auctions.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-4xl mb-3">🏷️</p>
        <p className="font-medium">No auctions yet.</p>
        <p className="text-sm mt-1">Be the first to create one.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {auctions.map((a) => (
        <AuctionCard key={a.auction_id} auction={a} />
      ))}
    </div>
  )
}
