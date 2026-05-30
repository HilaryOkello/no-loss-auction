#![no_std]
pub mod auction;
pub mod error;
pub mod events;
pub mod storage;
mod test;

use soroban_sdk::{contract, contractimpl, Address, Env, String};

use auction::AuctionContract;
use error::ContractError;
use storage::AuctionDetails;

#[contract]
pub struct NoLossAuction;

#[contractimpl]
impl NoLossAuction {
    pub fn __constructor(env: &Env, admin: Address) {
        AuctionContract::initialize(env, admin);
    }

    pub fn create_auction(
        env: &Env,
        seller: Address,
        token: Address,
        title: String,
        min_bid: i128,
        deadline: u64,
    ) -> Result<u64, ContractError> {
        AuctionContract::create_auction(env, seller, token, title, min_bid, deadline)
    }

    pub fn place_bid(
        env: &Env,
        bidder: Address,
        auction_id: u64,
        amount: i128,
    ) -> Result<(), ContractError> {
        AuctionContract::place_bid(env, bidder, auction_id, amount)
    }

    pub fn finalize_auction(env: &Env, auction_id: u64) -> Result<(), ContractError> {
        AuctionContract::finalize_auction(env, auction_id)
    }

    pub fn cancel_auction(env: &Env, auction_id: u64) -> Result<(), ContractError> {
        AuctionContract::cancel_auction(env, auction_id)
    }

    pub fn claim_refund(
        env: &Env,
        bidder: Address,
        auction_id: u64,
    ) -> Result<(), ContractError> {
        AuctionContract::claim_refund(env, bidder, auction_id)
    }

    pub fn get_auction(env: &Env, auction_id: u64) -> AuctionDetails {
        AuctionContract::get_auction(env, auction_id)
    }

    pub fn get_auction_count(env: &Env) -> u64 {
        AuctionContract::get_auction_count(env)
    }
}
