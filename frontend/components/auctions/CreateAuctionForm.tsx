"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
    if (!publicKey) return toast.error("Connect your wallet first")
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
      const signed = await buildCreateAuction(publicKey, form.title, minBidBigint, deadlineTimestamp)
      await submitSignedTx(signed)
      toast.success("Auction created!")
      router.push("/auctions")
    } catch (e: unknown) {
      const msg = (e as Error).message ?? "Failed to create auction"
      setError(msg.includes("friendbot")
        ? "Account not funded. Use the ⚡ Fund button in the navbar, then try again."
        : msg)
    } finally {
      setBusy(false)
    }
  }

  const inputClass = "bg-slate-50 border-slate-200 focus:border-indigo-400 focus:ring-indigo-400 rounded-lg"

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 text-lg">Auction Details</h2>
          <p className="text-sm text-slate-500 mt-0.5">Fill in the details below to list your auction.</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-sm font-medium text-slate-700">
              Auction Title
            </Label>
            <Input
              id="title"
              placeholder="e.g. Vintage Watch #007"
              required
              value={form.title}
              onChange={set("title")}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="min-bid" className="text-sm font-medium text-slate-700">
              Minimum Bid (tokens)
            </Label>
            <div className="relative">
              <Input
                id="min-bid"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="10.00"
                required
                value={form.minBid}
                onChange={set("minBid")}
                className={`${inputClass} pr-16`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                tokens
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Auction Deadline</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                required
                value={form.deadlineDate}
                onChange={set("deadlineDate")}
                min={new Date().toISOString().split("T")[0]}
                className={inputClass}
              />
              <Input
                type="time"
                value={form.deadlineTime}
                onChange={set("deadlineTime")}
                className={inputClass}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-11 text-sm font-medium"
            disabled={busy || !publicKey}
          >
            {!publicKey
              ? "Connect wallet to continue"
              : busy
              ? "Creating auction…"
              : "Create Auction"}
          </Button>
        </form>
      </div>

      {/* Info */}
      <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 px-5 py-4 text-sm text-slate-500 space-y-1">
        <p><span className="font-medium text-slate-700">Token:</span> SEP-41 test token on Stellar Testnet</p>
        <p><span className="font-medium text-slate-700">No-loss:</span> Every losing bidder is automatically refunded</p>
      </div>
    </div>
  )
}
