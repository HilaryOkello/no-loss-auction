"use client"

import { WalletContext, useWalletState } from "@/hooks/useWallet"

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const wallet = useWalletState()
  return (
    <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>
  )
}
