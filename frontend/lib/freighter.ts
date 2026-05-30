"use client"

import {
  isConnected,
  getPublicKey,
  signTransaction,
} from "@stellar/freighter-api"

export async function checkFreighter(): Promise<boolean> {
  try {
    const result = await isConnected()
    return result.isConnected
  } catch {
    return false
  }
}

export async function connectWallet(): Promise<string> {
  const connected = await checkFreighter()
  if (!connected) {
    throw new Error("Freighter not installed. Install from freighter.app")
  }
  const result = await getPublicKey()
  if (result.error) throw new Error(result.error)
  return result.publicKey
}

export async function signTx(
  xdr: string,
  networkPassphrase: string
): Promise<string> {
  const result = await signTransaction(xdr, { networkPassphrase })
  if (result.error) throw new Error(result.error)
  return result.signedTxXdr
}
