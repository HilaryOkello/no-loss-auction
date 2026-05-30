# No-Loss Auction Protocol

Decentralized auction system on Stellar Soroban where **losing bidders are automatically refunded** — no capital at risk.

## Contract ID (Testnet)

```
CC5YKIM3OBLGG7PLCIWR7CC4FKJFLAX2AYP3AMGFYE3BPBAG67OYEFIA
```

## Deployed Frontend

> Add Vercel URL here after deployment

## How It Works

1. Seller creates an auction with a minimum bid and deadline
2. Bidders place bids using SEP-41 tokens (two steps: approve → bid)
3. When outbid, the previous bidder is **automatically refunded** in the same transaction
4. After the deadline, the seller calls **Finalize** to receive the winning bid
5. Manual **Claim Refund** is available as a fallback

## Contract Functions

| Function | Description |
|----------|-------------|
| `create_auction(seller, token, title, min_bid, deadline)` | Create a new auction |
| `place_bid(bidder, auction_id, amount)` | Bid with SEP-41 token; auto-refunds previous bidder |
| `finalize_auction(auction_id)` | After deadline — sends winning bid to seller |
| `cancel_auction(auction_id)` | Cancel if no bids placed |
| `claim_refund(bidder, auction_id)` | Manual refund fallback |
| `get_auction(auction_id)` | Read auction state |
| `get_auction_count()` | Total auctions created |

## Token Used

SEP-41 test token deployed at:
```
CCIVE463U53GPGTJVI7XLNE7FND2PXQ6PEOR7HKZANVERD2Q7K6KKAMG
```

## Run Locally

```bash
# Contract
cd contracts/no-loss-auction
make test      # run all tests
make deploy    # build + deploy to testnet

# Frontend
cd frontend
npm install
cp .env.local.example .env.local   # fill in contract IDs
npm run dev
```

## Tech Stack

- **Smart Contract**: Rust, Soroban SDK v25, SEP-41 token standard
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Wallet**: Freighter (via `@stellar/freighter-api`)
- **Network**: Stellar Testnet
