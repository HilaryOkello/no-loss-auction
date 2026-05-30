"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { checkFreighter, connectWallet } from "@/lib/freighter"

interface WalletContextType {
  publicKey: string | null
  connect: () => Promise<void>
  disconnect: () => void
  isConnecting: boolean
  hasFreighter: boolean
}

export const WalletContext = createContext<WalletContextType>({
  publicKey: null,
  connect: async () => {},
  disconnect: () => {},
  isConnecting: false,
  hasFreighter: false,
})

export function useWallet() {
  return useContext(WalletContext)
}

export function useWalletState(): WalletContextType {
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [hasFreighter, setHasFreighter] = useState(false)

  useEffect(() => {
    checkFreighter().then(setHasFreighter)
    const saved = localStorage.getItem("walletPublicKey")
    if (saved) setPublicKey(saved)
  }, [])

  const connect = async () => {
    setIsConnecting(true)
    try {
      const key = await connectWallet()
      setPublicKey(key)
      localStorage.setItem("walletPublicKey", key)
    } catch (e) {
      console.error(e)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setPublicKey(null)
    localStorage.removeItem("walletPublicKey")
  }

  return { publicKey, connect, disconnect, isConnecting, hasFreighter }
}
