export type AuctionStatus = "Open" | "Finalized" | "Cancelled"

export interface Auction {
  auction_id: number
  seller: string
  token: string
  title: string
  min_bid: bigint
  deadline: number
  highest_bid: bigint
  highest_bidder: string | null
  status: AuctionStatus
}
