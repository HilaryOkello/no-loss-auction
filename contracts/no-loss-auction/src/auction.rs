use soroban_sdk::{token, Address, Env, String};

use crate::{
    error::ContractError,
    events,
    storage::{AuctionDetails, AuctionStatus, DataKey, RefundKey},
};

const LEDGER_BUMP: u32 = 100_000;

pub struct AuctionContract;

impl AuctionContract {
    pub fn initialize(env: &Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::AuctionCount, &0u64);
    }

    pub fn create_auction(
        env: &Env,
        seller: Address,
        token: Address,
        title: String,
        min_bid: i128,
        deadline: u64,
    ) -> Result<u64, ContractError> {
        seller.require_auth();

        if min_bid <= 0 {
            return Err(ContractError::InvalidMinBid);
        }
        if deadline <= env.ledger().timestamp() {
            return Err(ContractError::InvalidDeadline);
        }

        let mut count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::AuctionCount)
            .unwrap_or(0);
        count += 1;

        let auction = AuctionDetails {
            auction_id: count,
            seller: seller.clone(),
            token,
            title,
            min_bid,
            deadline,
            highest_bid: 0,
            highest_bidder: None,
            status: AuctionStatus::Open,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Auction(count), &auction);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Auction(count), LEDGER_BUMP, LEDGER_BUMP);
        env.storage()
            .instance()
            .set(&DataKey::AuctionCount, &count);

        events::auction_created(env, count, seller, min_bid, deadline);

        Ok(count)
    }

    pub fn place_bid(
        env: &Env,
        bidder: Address,
        auction_id: u64,
        amount: i128,
    ) -> Result<(), ContractError> {
        bidder.require_auth();

        let mut auction: AuctionDetails = env
            .storage()
            .persistent()
            .get(&DataKey::Auction(auction_id))
            .ok_or(ContractError::AuctionNotFound)?;

        match auction.status {
            AuctionStatus::Open => {}
            _ => return Err(ContractError::AuctionNotOpen),
        }

        if env.ledger().timestamp() >= auction.deadline {
            return Err(ContractError::AuctionExpired);
        }

        if amount < auction.min_bid || amount <= auction.highest_bid {
            return Err(ContractError::BidTooLow);
        }

        let contract_addr = env.current_contract_address();
        let token_client = token::Client::new(env, &auction.token);

        // Pull new bid into contract (bidder must have approved first)
        token_client.transfer_from(&contract_addr, &bidder, &contract_addr, &amount);

        // Auto-refund previous highest bidder
        if let Some(prev_bidder) = auction.highest_bidder.clone() {
            let prev_amount = auction.highest_bid;
            token_client.transfer(&contract_addr, &prev_bidder, &prev_amount);
            events::refund_sent(env, auction_id, prev_bidder, prev_amount);
        }

        auction.highest_bid = amount;
        auction.highest_bidder = Some(bidder.clone());

        env.storage()
            .persistent()
            .set(&DataKey::Auction(auction_id), &auction);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Auction(auction_id), LEDGER_BUMP, LEDGER_BUMP);

        events::bid_placed(env, auction_id, bidder, amount);

        Ok(())
    }

    pub fn finalize_auction(env: &Env, auction_id: u64) -> Result<(), ContractError> {
        let mut auction: AuctionDetails = env
            .storage()
            .persistent()
            .get(&DataKey::Auction(auction_id))
            .ok_or(ContractError::AuctionNotFound)?;

        match auction.status {
            AuctionStatus::Open => {}
            _ => return Err(ContractError::AuctionNotOpen),
        }

        if env.ledger().timestamp() < auction.deadline {
            return Err(ContractError::AuctionNotExpired);
        }

        auction.status = AuctionStatus::Finalized;

        if let Some(winner) = auction.highest_bidder.clone() {
            let token_client = token::Client::new(env, &auction.token);
            token_client.transfer(
                &env.current_contract_address(),
                &auction.seller,
                &auction.highest_bid,
            );
            events::auction_finalized(env, auction_id, winner, auction.highest_bid);
        }

        env.storage()
            .persistent()
            .set(&DataKey::Auction(auction_id), &auction);

        Ok(())
    }

    pub fn cancel_auction(env: &Env, auction_id: u64) -> Result<(), ContractError> {
        let mut auction: AuctionDetails = env
            .storage()
            .persistent()
            .get(&DataKey::Auction(auction_id))
            .ok_or(ContractError::AuctionNotFound)?;

        auction.seller.require_auth();

        match auction.status {
            AuctionStatus::Open => {}
            _ => return Err(ContractError::AuctionNotOpen),
        }

        if auction.highest_bidder.is_some() {
            return Err(ContractError::BidsExist);
        }

        auction.status = AuctionStatus::Cancelled;
        env.storage()
            .persistent()
            .set(&DataKey::Auction(auction_id), &auction);

        events::auction_cancelled(env, auction_id);

        Ok(())
    }

    pub fn claim_refund(
        env: &Env,
        bidder: Address,
        auction_id: u64,
    ) -> Result<(), ContractError> {
        bidder.require_auth();

        let key = DataKey::PendingRefund(RefundKey {
            auction_id,
            bidder: bidder.clone(),
        });

        let amount: i128 = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(ContractError::NoRefundPending)?;

        let auction: AuctionDetails = env
            .storage()
            .persistent()
            .get(&DataKey::Auction(auction_id))
            .ok_or(ContractError::AuctionNotFound)?;

        env.storage().persistent().remove(&key);

        let token_client = token::Client::new(env, &auction.token);
        token_client.transfer(&env.current_contract_address(), &bidder, &amount);

        events::refund_sent(env, auction_id, bidder, amount);

        Ok(())
    }

    pub fn get_auction(env: &Env, auction_id: u64) -> AuctionDetails {
        env.storage()
            .persistent()
            .get(&DataKey::Auction(auction_id))
            .unwrap()
    }

    pub fn get_auction_count(env: &Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::AuctionCount)
            .unwrap_or(0)
    }
}
