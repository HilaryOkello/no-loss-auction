"use client"

import { useWallet } from "@/hooks/useWallet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export function ConnectWallet() {
  const { publicKey, isFunded, isWrongNetwork, connect, disconnect, fundAccount, isConnecting, isFunding, hasFreighter } =
    useWallet()

  if (publicKey) {
    return (
      <div className="flex items-center gap-2">
        <Badge
          variant={isWrongNetwork ? "destructive" : "secondary"}
          className="font-mono text-xs"
        >
          {isWrongNetwork ? "⚠ Mainnet" : `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`}
        </Badge>

        {!isFunded && (
          <Button
            size="sm"
            variant="outline"
            className="text-yellow-600 border-yellow-400 hover:bg-yellow-50"
            disabled={isFunding}
            onClick={async () => {
              const t = toast.loading("Funding account via Friendbot…")
              try {
                await fundAccount()
                toast.success("Account funded! You can now transact.", { id: t })
              } catch (e: unknown) {
                toast.error((e as Error).message, { id: t })
              }
            }}
          >
            {isFunding ? "Funding…" : "⚡ Fund Account"}
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    )
  }

  if (!hasFreighter) {
    return (
      <a
        href="https://www.freighter.app/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button variant="outline" size="sm">
          Install Freighter
        </Button>
      </a>
    )
  }

  return (
    <Button size="sm" onClick={connect} disabled={isConnecting}>
      {isConnecting ? "Connecting…" : "Connect Wallet"}
    </Button>
  )
}
