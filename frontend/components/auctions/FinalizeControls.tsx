"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useWallet } from "@/hooks/useWallet"
import { buildFinalize, buildCancel, buildClaimRefund, submitSignedTx } from "@/lib/contract"
import { Auction } from "@/types/auction"

export function FinalizeControls({ auction, onSuccess }: { auction: Auction; onSuccess: () => void }) {
  const { publicKey } = useWallet()
  const [busy, setBusy] = useState(false)

  if (!publicKey) return null

  const isSeller = publicKey === auction.seller
  const isExpired = Date.now() / 1000 >= auction.deadline
  const hasBids = auction.highest_bidder !== null
  const isOpen = auction.status === "Open"

  const run = async (buildFn: () => Promise<string>, label: string) => {
    setBusy(true)
    try {
      const signed = await buildFn()
      await submitSignedTx(signed)
      toast.success(`${label} successful`)
      onSuccess()
    } catch (e: unknown) {
      toast.error((e as Error).message ?? `${label} failed`)
    } finally {
      setBusy(false)
    }
  }

  const showFinalize = isSeller && isOpen && isExpired
  const showCancel = isSeller && isOpen && !isExpired && !hasBids
  const showClaim = isOpen

  if (!showFinalize && !showCancel && !showClaim) return null

  return (
    <div className="pt-2 space-y-3 border-t border-slate-100">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Actions</p>
      <div className="flex flex-wrap gap-2">

        {showFinalize && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={busy} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Finalize Auction
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Finalize this auction?</AlertDialogTitle>
                <AlertDialogDescription>
                  The winning bid will be sent to your wallet. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => run(() => buildFinalize(publicKey, auction.auction_id), "Finalize")}
                >
                  Finalize
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {showCancel && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={busy} className="border-red-200 text-red-600 hover:bg-red-50">
                Cancel Auction
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel this auction?</AlertDialogTitle>
                <AlertDialogDescription>
                  Only possible because there are no bids yet. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Go back</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => run(() => buildCancel(publicKey, auction.auction_id), "Cancel")}
                >
                  Cancel Auction
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {showClaim && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={busy} className="text-slate-600">
                Claim Refund
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Claim pending refund?</AlertDialogTitle>
                <AlertDialogDescription>
                  Claims any on-chain refund stored for your address on this auction.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => run(() => buildClaimRefund(publicKey, auction.auction_id), "Refund")}
                >
                  Claim
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}
