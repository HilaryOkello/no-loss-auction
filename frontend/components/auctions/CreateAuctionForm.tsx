"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useWallet } from "@/hooks/useWallet"
import { buildCreateAuction, submitSignedTx } from "@/lib/contract"

export function CreateAuctionForm() {
  const { publicKey } = useWallet()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    title: "",
    minBid: "",
    deadlineDate: "",
    deadlineTime: "",
  })

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!publicKey) return toast.error("Connect wallet first")
    setError("")

    const minBidBigint = BigInt(Math.round(parseFloat(form.minBid) * 1_000_000))
    const deadlineTimestamp = Math.floor(
      new Date(`${form.deadlineDate}T${form.deadlineTime || "23:59"}`).getTime() / 1000
    )

    if (deadlineTimestamp <= Math.floor(Date.now() / 1000)) {
      return setError("Deadline must be in the future")
    }
    if (minBidBigint <= 0n) {
      return setError("Min bid must be greater than 0")
    }

    setBusy(true)
    try {
      const signed = await buildCreateAuction(
        publicKey,
        form.title,
        minBidBigint,
        deadlineTimestamp
      )
      await submitSignedTx(signed)
      toast.success("Auction created!")
      router.push("/auctions")
    } catch (e: unknown) {
      const msg = (e as Error).message ?? "Failed to create auction"
      setError(msg)
      toast.error(msg.includes("friendbot") ? "Account not funded — use ⚡ Fund Account in navbar" : msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Create Auction</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error.includes("friendbot")
                  ? "Account not funded. Use the ⚡ Fund Account button in the navbar, then try again."
                  : error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-1">
            <Label htmlFor="title">Auction Title</Label>
            <Input
              id="title"
              placeholder="e.g. Rare NFT #42"
              required
              value={form.title}
              onChange={set("title")}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="min-bid">Minimum Bid (tokens)</Label>
            <Input
              id="min-bid"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="10.00"
              required
              value={form.minBid}
              onChange={set("minBid")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="deadline-date">Deadline Date</Label>
              <Input
                id="deadline-date"
                type="date"
                required
                value={form.deadlineDate}
                onChange={set("deadlineDate")}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="deadline-time">Time</Label>
              <Input
                id="deadline-time"
                type="time"
                value={form.deadlineTime}
                onChange={set("deadlineTime")}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={busy || !publicKey}>
            {!publicKey ? "Connect wallet to create" : busy ? "Creating…" : "Create Auction"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
