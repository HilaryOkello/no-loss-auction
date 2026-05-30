import {
  Contract,
  Networks,
  TransactionBuilder,
  SorobanRpc,
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

export const server = new SorobanRpc.Server(RPC_URL)

// ── helpers ──────────────────────────────────────────────────────────────────

function scValToAuction(val: xdr.ScVal): Auction {
  const raw = scValToNative(val) as Record<string, unknown>

  const statusRaw = raw.status as Record<string, unknown>
  let status: Auction["status"] = "Open"
  if ("Finalized" in statusRaw) status = "Finalized"
  else if ("Cancelled" in statusRaw) status = "Cancelled"

  return {
    auction_id: Number(raw.auction_id),
    seller: raw.seller as string,
    token: raw.token as string,
    title: raw.title as string,
    min_bid: BigInt(raw.min_bid as string),
    deadline: Number(raw.deadline),
    highest_bid: BigInt(raw.highest_bid as string),
    highest_bidder: (raw.highest_bidder as string | null) ?? null,
    status,
  }
}

async function simulate(tx: TransactionBuilder): Promise<xdr.ScVal> {
  const builtTx = tx.build()
  const simResult = await server.simulateTransaction(builtTx)
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
  const account = await server.getAccount(publicKey)
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

  const signed = await signTx(preparedTx.toXDR(), NETWORK_PASSPHRASE)
  return signed
}

export async function submitSignedTx(signedXdr: string): Promise<string> {
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
  const sendResult = await server.sendTransaction(tx)
  if (sendResult.status === "ERROR") {
    throw new Error(JSON.stringify(sendResult.errorResult))
  }
  let hash = sendResult.hash
  let status = sendResult.status
  while (status === "PENDING" || status === "NOT_FOUND") {
    await new Promise((r) => setTimeout(r, 2000))
    const poll = await server.getTransaction(hash)
    if (poll.status !== "NOT_FOUND") {
      if (poll.status === "FAILED") throw new Error("Transaction failed")
      status = poll.status
    }
  }
  return hash
}

// ── read functions ────────────────────────────────────────────────────────────

export async function getAuctionCount(): Promise<number> {
  const contract = new Contract(CONTRACT_ID)
  const account = await server.getAccount(
    "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN"
  )
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call("get_auction_count"))
    .setTimeout(300)
    .build()

  const simResult = await server.simulateTransaction(tx)
  if (SorobanRpc.Api.isSimulationError(simResult)) return 0

  const retval = (
    simResult as SorobanRpc.Api.SimulateTransactionSuccessResponse
  ).result?.retval
  return retval ? Number(scValToNative(retval)) : 0
}

export async function getAuction(id: number): Promise<Auction> {
  const contract = new Contract(CONTRACT_ID)
  const account = await server.getAccount(
    "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN"
  )
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call("get_auction", nativeToScVal(id, { type: "u64" }))
    )
    .setTimeout(300)
    .build()

  const simResult = await server.simulateTransaction(tx)
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(simResult.error)
  }
  const retval = (
    simResult as SorobanRpc.Api.SimulateTransactionSuccessResponse
  ).result!.retval
  return scValToAuction(retval)
}

export async function getAllAuctions(): Promise<Auction[]> {
  const count = await getAuctionCount()
  const auctions: Auction[] = []
  for (let i = 1; i <= count; i++) {
    try {
      auctions.push(await getAuction(i))
    } catch {
      // skip missing
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
  const contract = new Contract(CONTRACT_ID)
  const op = contract.call(
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
  const tokenContract = new Contract(TOKEN_ID)
  const expirationLedger = 100000
  const op = tokenContract.call(
    "approve",
    new Address(publicKey).toScVal(),
    new Address(CONTRACT_ID).toScVal(),
    nativeToScVal(amount, { type: "i128" }),
    nativeToScVal(expirationLedger, { type: "u32" })
  )
  return buildAndSign(publicKey, op)
}

export async function buildPlaceBid(
  publicKey: string,
  auctionId: number,
  amount: bigint
): Promise<string> {
  const contract = new Contract(CONTRACT_ID)
  const op = contract.call(
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
  const contract = new Contract(CONTRACT_ID)
  const op = contract.call(
    "finalize_auction",
    nativeToScVal(auctionId, { type: "u64" })
  )
  return buildAndSign(publicKey, op)
}

export async function buildCancel(
  publicKey: string,
  auctionId: number
): Promise<string> {
  const contract = new Contract(CONTRACT_ID)
  const op = contract.call(
    "cancel_auction",
    nativeToScVal(auctionId, { type: "u64" })
  )
  return buildAndSign(publicKey, op)
}

export async function buildClaimRefund(
  publicKey: string,
  auctionId: number
): Promise<string> {
  const contract = new Contract(CONTRACT_ID)
  const op = contract.call(
    "claim_refund",
    new Address(publicKey).toScVal(),
    nativeToScVal(auctionId, { type: "u64" })
  )
  return buildAndSign(publicKey, op)
}
