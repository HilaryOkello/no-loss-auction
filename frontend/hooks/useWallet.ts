"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { checkFreighter, connectWallet, getFreighterNetwork, isTestnet } from "@/lib/freighter"
import { isAccountFunded, fundWithFriendbot } from "@/lib/friendbot"

interface WalletContextType {
  publicKey: string | null
  isFunded: boolean
  isWrongNetwork: boolean
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
  isWrongNetwork: false,
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
  const [isWrongNetwork, setIsWrongNetwork] = useState(false)
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

  // Poll network every 5s so banner updates if user switches in Freighter
  useEffect(() => {
    if (!publicKey) return
    const check = async () => {
      const passphrase = await getFreighterNetwork()
      if (passphrase) setIsWrongNetwork(!isTestnet(passphrase))
    }
    check()
    const interval = setInterval(check, 5000)
    return () => clearInterval(interval)
  }, [publicKey])

  const connect = async () => {
    setIsConnecting(true)
    try {
      const key = await connectWallet()
      setPublicKey(key)
      localStorage.setItem("walletPublicKey", key)
      const [funded, passphrase] = await Promise.all([
        isAccountFunded(key),
        getFreighterNetwork(),
      ])
      setIsFunded(funded)
      if (passphrase) setIsWrongNetwork(!isTestnet(passphrase))
    } catch (e) {
      console.error(e)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setPublicKey(null)
    setIsFunded(false)
    setIsWrongNetwork(false)
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

  return { publicKey, isFunded, isWrongNetwork, connect, disconnect, fundAccount, isConnecting, isFunding, hasFreighter }
}
