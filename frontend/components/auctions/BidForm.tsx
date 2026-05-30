"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useWallet } from "@/hooks/useWallet"
import { buildApproveToken, buildPlaceBid, submitSignedTx } from "@/lib/contract"
import { Auction } from "@/types/auction"

function formatAmount(amount: bigint): string {
  return (Number(amount) / 1_000_000).toFixed(2)
}

export function BidForm({
  auction,
  onSuccess,
}: {
  auction: Auction
  onSuccess: () => void
}) {
  const { publicKey } = useWallet()
  const [amount, setAmount] = useState("")
  const [step, setStep] = useState<"idle" | "approving" | "bidding">("idle")
  const [approved, setApproved] = useState(false)
  const [error, setError] = useState("")

  const minBidDisplay = formatAmount(
    auction.highest_bid > 0n ? auction.highest_bid + 1n : auction.min_bid
  )

  const isOpen = auction.status === "Open"
  const isExpired = Date.now() / 1000 >= auction.deadline

  const handleApprove = async () => {
    if (!publicKey) return toast.error("Connect wallet first")
    const amountBigint = BigInt(Math.round(parseFloat(amount) * 1_000_000))
    if (amountBigint <= auction.highest_bid) {
      return setError(`Bid must exceed current highest: ${formatAmount(auction.highest_bid)} tokens`)
    }
    if (amountBigint < auction.min_bid) {
      return setError(`Bid must be at least ${formatAmount(auction.min_bid)} tokens`)
    }
    setError("")
    setStep("approving")
    try {
      const signed = await buildApproveToken(publicKey, amountBigint)
      await submitSignedTx(signed)
      setApproved(true)
      toast.success("Token spend approved")
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Approval failed")
    } finally {
      setStep("idle")
    }
  }

  const handleBid = async () => {
    if (!publicKey) return toast.error("Connect wallet first")
    const amountBigint = BigInt(Math.round(parseFloat(amount) * 1_000_000))
    setStep("bidding")
    try {
      const signed = await buildPlaceBid(publicKey, auction.auction_id, amountBigint)
      await submitSignedTx(signed)
      toast.success("Bid placed successfully!")
      setApproved(false)
      setAmount("")
      onSuccess()
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Bid failed")
    } finally {
      setStep("idle")
    }
  }

  if (!isOpen || isExpired) return null

  return (
    <div className="space-y-4">
      <Separator />
      <h3 className="font-semibold">Place a Bid</h3>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1">
        <Label htmlFor="bid-amount">
          Amount (tokens) — min {minBidDisplay}
        </Label>
        <Input
          id="bid-amount"
          type="number"
          step="0.01"
          min={minBidDisplay}
          placeholder={minBidDisplay}
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value)
            setApproved(false)
          }}
          disabled={step !== "idle"}
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleApprove}
          disabled={!amount || step !== "idle" || approved}
        >
          {step === "approving" ? "Approving…" : approved ? "✓ Approved" : "1. Approve"}
        </Button>
        <Button
          className="flex-1"
          onClick={handleBid}
          disabled={!approved || step !== "idle"}
        >
          {step === "bidding" ? "Placing…" : "2. Place Bid"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        No-loss: you will be automatically refunded if outbid.
      </p>
    </div>
  )
}
