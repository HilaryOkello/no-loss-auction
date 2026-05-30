use soroban_sdk::{contracttype, Address, String};

#[derive(Clone)]
#[contracttype]
pub enum AuctionStatus {
    Open,
    Finalized,
    Cancelled,
}

#[derive(Clone)]
#[contracttype]
pub struct AuctionDetails {
    pub auction_id: u64,
    pub seller: Address,
    pub token: Address,
    pub title: String,
    pub min_bid: i128,
    pub deadline: u64,
    pub highest_bid: i128,
    pub highest_bidder: Option<Address>,
    pub status: AuctionStatus,
}

#[derive(Clone)]
#[contracttype]
pub struct RefundKey {
    pub auction_id: u64,
    pub bidder: Address,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    AuctionCount,
    Auction(u64),
    PendingRefund(RefundKey),
}
