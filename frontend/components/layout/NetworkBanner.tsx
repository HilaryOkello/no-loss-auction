"use client"

import { useWallet } from "@/hooks/useWallet"

export function NetworkBanner() {
  const { publicKey, isWrongNetwork } = useWallet()

  if (!publicKey || !isWrongNetwork) return null

  return (
    <div className="bg-yellow-400 text-yellow-900 text-sm font-medium text-center py-2 px-4">
      ⚠️ Freighter is on <strong>Mainnet</strong>. Open Freighter →{" "}
      <strong>Settings → Network → Testnet</strong> to use this app.
    </div>
  )
}
