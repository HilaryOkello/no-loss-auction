"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWallet } from "@/hooks/useWallet"
import { buildApproveToken, buildPlaceBid, submitSignedTx } from "@/lib/contract"
import { Auction } from "@/types/auction"

function fmt(amount: bigint): string {
  return (Number(amount) / 1_000_000).toFixed(2)
}

export function BidForm({ auction, onSuccess }: { auction: Auction; onSuccess: () => void }) {
  const { publicKey } = useWallet()
  const [amount, setAmount] = useState("")
  const [step, setStep] = useState<"idle" | "approving" | "bidding">("idle")
  const [approved, setApproved] = useState(false)
  const [error, setError] = useState("")

  const isOpen = auction.status === "Open"
  const isExpired = Date.now() / 1000 >= auction.deadline
  const minNext = auction.highest_bid > 0n ? auction.highest_bid + 1_000n : auction.min_bid
  const minDisplay = fmt(minNext)

  if (!isOpen || isExpired) return null

  const validate = (raw: string): bigint | null => {
    const n = parseFloat(raw)
    if (isNaN(n) || n <= 0) { setError("Enter a valid amount"); return null }
    const bigval = BigInt(Math.round(n * 1_000_000))
    if (bigval < auction.min_bid) { setError(`Minimum bid is ${fmt(auction.min_bid)} tokens`); return null }
    if (bigval <= auction.highest_bid) { setError(`Must exceed current highest: ${fmt(auction.highest_bid)} tokens`); return null }
    setError("")
    return bigval
  }

  const handleApprove = async () => {
    if (!publicKey) return toast.error("Connect wallet first")
    const val = validate(amount)
    if (!val) return
    setStep("approving")
    try {
      const signed = await buildApproveToken(publicKey, val)
      await submitSignedTx(signed)
      setApproved(true)
      toast.success("Approved — now place your bid")
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Approval failed")
    } finally {
      setStep("idle")
    }
  }

  const handleBid = async () => {
    if (!publicKey) return toast.error("Connect wallet first")
    const val = validate(amount)
    if (!val) return
    setStep("bidding")
    try {
      const signed = await buildPlaceBid(publicKey, auction.auction_id, val)
      await submitSignedTx(signed)
      toast.success("Bid placed!")
      setApproved(false)
      setAmount("")
      onSuccess()
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Bid failed")
    } finally {
      setStep("idle")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Place a Bid</h3>
        <span className="text-xs text-slate-400">Min: {minDisplay} tokens</span>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="bid-amount" className="text-sm text-slate-600">
          Bid amount (tokens)
        </Label>
        <Input
          id="bid-amount"
          type="number"
          step="0.01"
          placeholder={minDisplay}
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setApproved(false) }}
          disabled={step !== "idle"}
          className="bg-slate-50 border-slate-200 focus:border-indigo-400 focus:ring-indigo-400"
        />
      </div>

      {/* Two-step buttons */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Button
            variant="outline"
            className={`w-full border-2 ${approved ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200"}`}
            onClick={handleApprove}
            disabled={!amount || step !== "idle" || approved}
          >
            {step === "approving" ? (
              <span className="flex items-center gap-2"><Spinner />Approving…</span>
            ) : approved ? "✓ Approved" : "1. Approve"}
          </Button>
          <p className="text-[10px] text-slate-400 text-center">Allow contract to spend tokens</p>
        </div>

        <div className="space-y-1">
          <Button
            className={`w-full ${approved ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-slate-100 text-slate-400"}`}
            onClick={handleBid}
            disabled={!approved || step !== "idle"}
          >
            {step === "bidding" ? (
              <span className="flex items-center gap-2"><Spinner />Placing…</span>
            ) : "2. Place Bid"}
          </Button>
          <p className="text-[10px] text-slate-400 text-center">Submit bid to contract</p>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center">
        🔄 Outbid? Your tokens return automatically.
      </p>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}
