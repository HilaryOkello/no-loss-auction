"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getAuction } from "@/lib/contract"
import { Auction } from "@/types/auction"
import { StatusBadge } from "@/components/auctions/StatusBadge"
import { CountdownTimer } from "@/components/auctions/CountdownTimer"
import { BidForm } from "@/components/auctions/BidForm"
import { FinalizeControls } from "@/components/auctions/FinalizeControls"

function fmt(amount: bigint): string {
  return (Number(amount) / 1_000_000).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
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

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-48 rounded-lg bg-slate-100 animate-pulse" />
        <div className="h-80 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-500">Auction not found.</p>
        <Link href="/auctions" className="text-indigo-600 text-sm mt-2 inline-block hover:underline">
          ← Back to auctions
        </Link>
      </div>
    )
  }

  const hasBids = auction.highest_bid > 0n

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/auctions" className="text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1">
        ← All auctions
      </Link>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold text-slate-900 leading-snug">{auction.title}</h1>
            <div className="shrink-0">
              <StatusBadge status={auction.status} />
            </div>
          </div>
          <div className="mt-2">
            <CountdownTimer deadline={auction.deadline} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y sm:divide-y-0 divide-slate-100 border-b border-slate-100">
          <div className="px-5 py-4">
            <p className="text-xs text-slate-400 mb-1">
              {hasBids ? "Highest bid" : "Starting bid"}
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {hasBids ? fmt(auction.highest_bid) : fmt(auction.min_bid)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">tokens</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs text-slate-400 mb-1">Min bid</p>
            <p className="text-xl font-semibold text-slate-700">{fmt(auction.min_bid)}</p>
            <p className="text-xs text-slate-400 mt-0.5">tokens</p>
          </div>
          <div className="px-5 py-4 col-span-2 sm:col-span-1">
            <p className="text-xs text-slate-400 mb-1">No. of bids</p>
            <p className="text-xl font-semibold text-slate-700">{hasBids ? "≥1" : "0"}</p>
            <p className="text-xs text-slate-400 mt-0.5">auto-refunded if outbid</p>
          </div>
        </div>

        {/* Addresses */}
        <div className="px-6 py-4 space-y-3 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-400 mb-1">Seller</p>
            <p className="text-xs font-mono text-slate-600 break-all">{auction.seller}</p>
          </div>
          {auction.highest_bidder && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Highest bidder</p>
              <p className="text-xs font-mono text-slate-600 break-all">{auction.highest_bidder}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-5 space-y-4">
          <BidForm auction={auction} onSuccess={load} />
          <FinalizeControls auction={auction} onSuccess={load} />
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-5 py-4 text-sm text-indigo-700">
        <strong>No-loss guarantee:</strong> If you get outbid, your tokens are automatically returned to your wallet in the same transaction.
      </div>
    </div>
  )
}
