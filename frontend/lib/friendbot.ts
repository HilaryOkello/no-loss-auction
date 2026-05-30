import { server } from "./contract"

export async function fundWithFriendbot(publicKey: string): Promise<void> {
  const res = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
  )
  if (!res.ok) {
    const body = await res.text()
    // Already funded is fine
    if (body.includes("op_already_exists") || body.includes("createAccountAlreadyExist")) return
    throw new Error("Friendbot failed: " + body)
  }
  // Poll until account exists on RPC
  for (let i = 0; i < 15; i++) {
    try {
      await server.getAccount(publicKey)
      return
    } catch {
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
  throw new Error("Account still not active after funding — try again")
}

export async function isAccountFunded(publicKey: string): Promise<boolean> {
  try {
    await server.getAccount(publicKey)
    return true
  } catch {
    return false
  }
}
