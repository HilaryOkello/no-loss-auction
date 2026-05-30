import Link from "next/link"
import { Auction } from "@/types/auction"
import { StatusBadge } from "./StatusBadge"
import { CountdownTimer } from "./CountdownTimer"

function fmt(amount: bigint): string {
  return (Number(amount) / 1_000_000).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function AuctionCard({ auction }: { auction: Auction }) {
  const hasBids = auction.highest_bid > 0n

  return (
    <Link href={`/auctions/${auction.auction_id}`} className="group block">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 h-full flex flex-col gap-4 hover:border-indigo-300 hover:shadow-md transition-all duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {auction.title}
          </h3>
          <StatusBadge status={auction.status} />
        </div>

        {/* Bid info */}
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-center py-3 px-3 bg-slate-50 rounded-xl">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">
                {hasBids ? "Highest bid" : "Starting bid"}
              </p>
              <p className="font-bold text-slate-900 text-lg">
                {hasBids ? fmt(auction.highest_bid) : fmt(auction.min_bid)}
                <span className="text-xs font-normal text-slate-400 ml-1">tokens</span>
              </p>
            </div>
            {hasBids && (
              <div className="text-right">
                <p className="text-xs text-slate-400 mb-0.5">Min bid</p>
                <p className="text-sm text-slate-600">{fmt(auction.min_bid)}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="truncate font-mono">
              {auction.seller.slice(0, 6)}…{auction.seller.slice(-4)}
            </span>
            <CountdownTimer deadline={auction.deadline} />
          </div>
        </div>

        {/* CTA */}
        <div className="pt-1 border-t border-slate-100">
          <span className="text-xs font-medium text-indigo-600 group-hover:text-indigo-700">
            {auction.status === "Open" ? "Place a bid →" : "View details →"}
          </span>
        </div>
      </div>
    </Link>
  )
}
