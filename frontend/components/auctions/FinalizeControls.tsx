"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { useWallet } from "@/hooks/useWallet"
import { buildFinalize, buildCancel, buildClaimRefund, submitSignedTx } from "@/lib/contract"
import { Auction } from "@/types/auction"

export function FinalizeControls({
  auction,
  onSuccess,
}: {
  auction: Auction
  onSuccess: () => void
}) {
  const { publicKey } = useWallet()
  const [busy, setBusy] = useState(false)

  if (!publicKey || auction.status !== "Open") return null

  const isSeller = publicKey === auction.seller
  const isExpired = Date.now() / 1000 >= auction.deadline
  const hasBids = auction.highest_bidder !== null

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

  return (
    <div className="space-y-3">
      <Separator />
      <p className="text-sm text-muted-foreground font-medium">Seller controls</p>

      <div className="flex gap-2 flex-wrap">
        {isSeller && isExpired && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={busy}>Finalize Auction</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Finalize this auction?</AlertDialogTitle>
                <AlertDialogDescription>
                  Winning bid will be sent to your wallet. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    run(
                      () => buildFinalize(publicKey, auction.auction_id),
                      "Finalize"
                    )
                  }
                >
                  Finalize
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {isSeller && !isExpired && !hasBids && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={busy}>
                Cancel Auction
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel this auction?</AlertDialogTitle>
                <AlertDialogDescription>
                  Only possible because there are no bids yet. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Go back</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground"
                  onClick={() =>
                    run(
                      () => buildCancel(publicKey, auction.auction_id),
                      "Cancel"
                    )
                  }
                >
                  Cancel Auction
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={busy}>
              Claim Refund
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Claim pending refund?</AlertDialogTitle>
              <AlertDialogDescription>
                This claims any pending refund stored on-chain for your address.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  run(
                    () => buildClaimRefund(publicKey, auction.auction_id),
                    "Refund"
                  )
                }
              >
                Claim
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
