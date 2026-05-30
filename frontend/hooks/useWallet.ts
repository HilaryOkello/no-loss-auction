"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { checkFreighter, connectWallet } from "@/lib/freighter"
import { isAccountFunded, fundWithFriendbot } from "@/lib/friendbot"

interface WalletContextType {
  publicKey: string | null
  isFunded: boolean
  connect: () => Promise<void>
  disconnect: () => void
  fundAccount: () => Promise<void>
  isConnecting: boolean
  isFunding: boolean
  hasFreighter: boolean
}

export const WalletContext = createContext<WalletContextType>({
  publicKey: null,
  isFunded: false,
  connect: async () => {},
  disconnect: () => {},
  fundAccount: async () => {},
  isConnecting: false,
  isFunding: false,
  hasFreighter: false,
})

export function useWallet() {
  return useContext(WalletContext)
}

export function useWalletState(): WalletContextType {
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [isFunded, setIsFunded] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isFunding, setIsFunding] = useState(false)
  const [hasFreighter, setHasFreighter] = useState(false)

  useEffect(() => {
    checkFreighter().then(setHasFreighter)
    const saved = localStorage.getItem("walletPublicKey")
    if (saved) {
      setPublicKey(saved)
      isAccountFunded(saved).then(setIsFunded)
    }
  }, [])

  const connect = async () => {
    setIsConnecting(true)
    try {
      const key = await connectWallet()
      setPublicKey(key)
      localStorage.setItem("walletPublicKey", key)
      const funded = await isAccountFunded(key)
      setIsFunded(funded)
    } catch (e) {
      console.error(e)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setPublicKey(null)
    setIsFunded(false)
    localStorage.removeItem("walletPublicKey")
  }

  const fundAccount = async () => {
    if (!publicKey) return
    setIsFunding(true)
    try {
      await fundWithFriendbot(publicKey)
      setIsFunded(true)
    } finally {
      setIsFunding(false)
    }
  }

  return { publicKey, isFunded, connect, disconnect, fundAccount, isConnecting, isFunding, hasFreighter }
}
