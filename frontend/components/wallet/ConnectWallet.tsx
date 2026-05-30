"use client"

import { useWallet } from "@/hooks/useWallet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export function ConnectWallet() {
  const {
    publicKey,
    isFunded,
    isWrongNetwork,
    connect,
    disconnect,
    fundAccount,
    isConnecting,
    isFunding,
    hasFreighter,
  } = useWallet()

  if (publicKey) {
    return (
      <div className="flex items-center gap-2">
        {isWrongNetwork ? (
          <Badge variant="destructive" className="text-xs font-mono hidden sm:flex">
            ⚠ Mainnet
          </Badge>
        ) : !isFunded ? (
          <Button
            size="sm"
            variant="outline"
            className="text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs hidden sm:inline-flex"
            disabled={isFunding}
            onClick={async () => {
              const t = toast.loading("Funding via Friendbot…")
              try {
                await fundAccount()
                toast.success("Account funded!", { id: t })
              } catch (e: unknown) {
                toast.error((e as Error).message, { id: t })
              }
            }}
          >
            {isFunding ? "Funding…" : "⚡ Fund"}
          </Button>
        ) : (
          <Badge variant="secondary" className="text-xs font-mono hidden sm:flex bg-emerald-50 text-emerald-700 border border-emerald-200">
            ● Testnet
          </Badge>
        )}
        <Badge variant="outline" className="text-xs font-mono">
          {publicKey.slice(0, 4)}…{publicKey.slice(-4)}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={disconnect}
          className="text-slate-500 hover:text-slate-900 text-xs px-2"
        >
          Disconnect
        </Button>
      </div>
    )
  }

  if (!hasFreighter) {
    return (
      <a href="https://www.freighter.app/" target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm" className="text-xs">
          Install Freighter
        </Button>
      </a>
    )
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={connect}
      disabled={isConnecting}
      className="text-slate-700 border-slate-300"
    >
      {isConnecting ? "Connecting…" : "Connect Wallet"}
    </Button>
  )
}
