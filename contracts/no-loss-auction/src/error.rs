use soroban_sdk::contracterror;

#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ContractError {
    AlreadyInitialized = 1,
    Unauthorized = 2,
    AuctionNotFound = 3,
    AuctionNotOpen = 4,
    AuctionExpired = 5,
    AuctionNotExpired = 6,
    BidTooLow = 7,
    BidsExist = 8,
    NoRefundPending = 9,
    InvalidDeadline = 10,
    InvalidMinBid = 11,
}
