"use client"

import { useWallet } from "@/hooks/useWallet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function ConnectWallet() {
  const { publicKey, connect, disconnect, isConnecting, hasFreighter } =
    useWallet()

  if (publicKey) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="font-mono text-xs">
          {publicKey.slice(0, 6)}...{publicKey.slice(-4)}
        </Badge>
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
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </Button>
  )
}
