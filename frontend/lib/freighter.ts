"use client"

import {
  isConnected,
  getAddress,
  getNetworkDetails,
  signTransaction,
  requestAccess,
} from "@stellar/freighter-api"
import { Networks } from "@stellar/stellar-sdk"

export async function checkFreighter(): Promise<boolean> {
  try {
    const result = await isConnected()
    return result.isConnected
  } catch {
    return false
  }
}

export async function getFreighterNetwork(): Promise<string> {
  try {
    const result = await getNetworkDetails()
    if (result.error) return ""
    return result.networkPassphrase ?? ""
  } catch {
    return ""
  }
}

export function isTestnet(passphrase: string): boolean {
  return passphrase === Networks.TESTNET
}

export async function connectWallet(): Promise<string> {
  const connected = await checkFreighter()
  if (!connected) {
    throw new Error("Freighter not installed. Install from freighter.app")
  }
  await requestAccess()
  const result = await getAddress()
  if (result.error) throw new Error(result.error)
  return result.address
}

export async function signTx(
  xdr: string,
  networkPassphrase: string
): Promise<string> {
  // Ensure site is connected — required on every new session/domain
  await requestAccess()

  // Re-check network right before signing to give helpful error
  const currentPassphrase = await getFreighterNetwork()
  if (currentPassphrase && !isTestnet(currentPassphrase)) {
    throw new Error(
      "Freighter is set to Mainnet. Open Freighter → Settings → Network → switch to Testnet, then try again."
    )
  }
  const result = await signTransaction(xdr, { networkPassphrase })
  if (result.error) throw new Error(result.error)
  return result.signedTxXdr
}
