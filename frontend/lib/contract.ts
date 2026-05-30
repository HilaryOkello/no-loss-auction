import {
  Account,
  Contract,
  Keypair,
  Networks,
  TransactionBuilder,
  rpc as SorobanRpc,
  nativeToScVal,
  scValToNative,
  Address,
  BASE_FEE,
  xdr,
} from "@stellar/stellar-sdk"
import { Auction } from "@/types/auction"
import { signTx } from "./freighter"

const RPC_URL = "https://soroban-testnet.stellar.org"
const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID!
const TOKEN_ID = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ID!
const NETWORK_PASSPHRASE = Networks.TESTNET

// Random keypair per call — always a valid key, no hardcoded address needed
function dummyAccount() {
  return new Account(Keypair.random().publicKey(), "0")
}

export const server = new SorobanRpc.Server(RPC_URL)

// ── helpers ───────────────────────────────────────────────────────────────────

function parseStatus(raw: unknown): Auction["status"] {
  // scValToNative returns enum as { VariantName: null } or plain string
  if (typeof raw === "string") {
    if (raw === "Finalized") return "Finalized"
    if (raw === "Cancelled") return "Cancelled"
    return "Open"
  }
  if (raw && typeof raw === "object") {
    if ("Finalized" in raw) return "Finalized"
    if ("Cancelled" in raw) return "Cancelled"
  }
  return "Open"
}

function toBigInt(val: unknown): bigint {
  if (typeof val === "bigint") return val
  if (typeof val === "number") return BigInt(val)
  if (typeof val === "string") return BigInt(val)
  return 0n
}

function scValToAuction(val: xdr.ScVal): Auction {
  const raw = scValToNative(val) as Record<string, unknown>

  return {
    auction_id: Number(raw.auction_id),
    seller: raw.seller as string,
    token: raw.token as string,
    title: raw.title as string,
    min_bid: toBigInt(raw.min_bid),
    deadline: Number(raw.deadline),
    highest_bid: toBigInt(raw.highest_bid),
    highest_bidder: (raw.highest_bidder as string | undefined) ?? null,
    status: parseStatus(raw.status),
  }
}

// Read-only simulation — uses local dummy account, no RPC account fetch
async function readSimulate(op: xdr.Operation): Promise<xdr.ScVal> {
  const account = dummyAccount()
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(300)
    .build()

  const simResult = await server.simulateTransaction(tx)
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(simResult.error)
  }
  return (simResult as SorobanRpc.Api.SimulateTransactionSuccessResponse)
    .result!.retval
}

async function buildAndSign(
  publicKey: string,
  callOp: xdr.Operation
): Promise<string> {
  let account
  try {
    account = await server.getAccount(publicKey)
  } catch {
    throw new Error(
      `Account not funded on testnet. Fund it at: https://friendbot.stellar.org?addr=${publicKey}`
    )
  }

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(callOp)
    .setTimeout(300)
    .build()

  const simResult = await server.simulateTransaction(tx)
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(simResult.error)
  }

  const preparedTx = SorobanRpc.assembleTransaction(
    tx,
    simResult as SorobanRpc.Api.SimulateTransactionSuccessResponse
  ).build()

  return signTx(preparedTx.toXDR(), NETWORK_PASSPHRASE)
}

export async function submitSignedTx(signedXdr: string): Promise<string> {
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
  const sendResult = await server.sendTransaction(tx)
  if (sendResult.status === "ERROR") {
    throw new Error(JSON.stringify(sendResult.errorResult))
  }
  const hash = sendResult.hash
  let done = false
  while (!done) {
    await new Promise((r) => setTimeout(r, 2000))
    const poll = await server.getTransaction(hash)
    if (poll.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
      done = true
    } else if (poll.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
      throw new Error("Transaction failed")
    }
    // NOT_FOUND = still pending, keep polling
  }
  return hash
}

// ── read functions ────────────────────────────────────────────────────────────

export async function getAuctionCount(): Promise<number> {
  const retval = await readSimulate(
    new Contract(CONTRACT_ID).call("get_auction_count")
  )
  const val = scValToNative(retval)
  return Number(val)
}

export async function getAuction(id: number): Promise<Auction> {
  const retval = await readSimulate(
    new Contract(CONTRACT_ID).call(
      "get_auction",
      nativeToScVal(id, { type: "u64" })
    )
  )
  return scValToAuction(retval)
}

export async function getAllAuctions(): Promise<Auction[]> {
  const count = await getAuctionCount()
  const auctions: Auction[] = []
  for (let i = 1; i <= count; i++) {
    try {
      auctions.push(await getAuction(i))
    } catch {
      // skip corrupted entries
    }
  }
  return auctions
}

// ── write functions ───────────────────────────────────────────────────────────

export async function buildCreateAuction(
  publicKey: string,
  title: string,
  minBid: bigint,
  deadlineTimestamp: number
): Promise<string> {
  const op = new Contract(CONTRACT_ID).call(
    "create_auction",
    new Address(publicKey).toScVal(),
    new Address(TOKEN_ID).toScVal(),
    nativeToScVal(title, { type: "string" }),
    nativeToScVal(minBid, { type: "i128" }),
    nativeToScVal(deadlineTimestamp, { type: "u64" })
  )
  return buildAndSign(publicKey, op)
}

export async function buildApproveToken(
  publicKey: string,
  amount: bigint
): Promise<string> {
  const op = new Contract(TOKEN_ID).call(
    "approve",
    new Address(publicKey).toScVal(),
    new Address(CONTRACT_ID).toScVal(),
    nativeToScVal(amount, { type: "i128" }),
    nativeToScVal(100_000, { type: "u32" })
  )
  return buildAndSign(publicKey, op)
}

export async function buildPlaceBid(
  publicKey: string,
  auctionId: number,
  amount: bigint
): Promise<string> {
  const op = new Contract(CONTRACT_ID).call(
    "place_bid",
    new Address(publicKey).toScVal(),
    nativeToScVal(auctionId, { type: "u64" }),
    nativeToScVal(amount, { type: "i128" })
  )
  return buildAndSign(publicKey, op)
}

export async function buildFinalize(
  publicKey: string,
  auctionId: number
): Promise<string> {
  const op = new Contract(CONTRACT_ID).call(
    "finalize_auction",
    nativeToScVal(auctionId, { type: "u64" })
  )
  return buildAndSign(publicKey, op)
}

export async function buildCancel(
  publicKey: string,
  auctionId: number
): Promise<string> {
  const op = new Contract(CONTRACT_ID).call(
    "cancel_auction",
    nativeToScVal(auctionId, { type: "u64" })
  )
  return buildAndSign(publicKey, op)
}

export async function buildClaimRefund(
  publicKey: string,
  auctionId: number
): Promise<string> {
  const op = new Contract(CONTRACT_ID).call(
    "claim_refund",
    new Address(publicKey).toScVal(),
    nativeToScVal(auctionId, { type: "u64" })
  )
  return buildAndSign(publicKey, op)
}
