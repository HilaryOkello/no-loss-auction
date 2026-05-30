"use client"

import { useEffect, useState } from "react"
import { getAllAuctions } from "@/lib/contract"
import { Auction } from "@/types/auction"
import { AuctionCard } from "./AuctionCard"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function AuctionList() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async () => {
    try {
      const data = await getAllAuctions()
      setAuctions(data.reverse())
      setError("")
    } catch (e: unknown) {
      setError((e as Error).message ?? "Failed to load auctions")
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
          <div key={i} className="h-56 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16 px-4">
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      </div>
    )
  }

  if (auctions.length === 0) {
    return (
      <div className="text-center py-24 px-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🏷️</span>
        </div>
        <h3 className="font-semibold text-slate-800 text-lg">No auctions yet</h3>
        <p className="text-slate-500 text-sm mt-1 mb-6">
          Be the first to list something on BidStar.
        </p>
        <Link href="/create">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            Create First Auction
          </Button>
        </Link>
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
