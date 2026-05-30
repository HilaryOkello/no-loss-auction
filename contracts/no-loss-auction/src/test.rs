#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::{Client as TokenClient, StellarAssetClient},
    Address, Env, String,
};

use crate::{error::ContractError, storage::AuctionStatus, NoLossAuction, NoLossAuctionClient};

fn setup_env() -> (Env, Address, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let seller = Address::generate(&env);
    let bidder1 = Address::generate(&env);
    let bidder2 = Address::generate(&env);

    (env, admin, seller, bidder1, bidder2)
}

fn deploy_token(env: &Env, admin: &Address) -> Address {
    let token_id = env.register_stellar_asset_contract_v2(admin.clone());
    let token_client = StellarAssetClient::new(env, &token_id.address());
    token_client.mint(admin, &1_000_000_000);
    token_id.address()
}

fn deploy_auction<'a>(env: &'a Env, admin: &'a Address) -> NoLossAuctionClient<'a> {
    let contract_id = env.register(NoLossAuction, (admin,));
    NoLossAuctionClient::new(env, &contract_id)
}

fn fund_bidder(env: &Env, token: &Address, admin: &Address, bidder: &Address, amount: i128) {
    StellarAssetClient::new(env, token).mint(bidder, &amount);
}

#[test]
fn test_create_auction() {
    let (env, admin, seller, _, _) = setup_env();
    let token = deploy_token(&env, &admin);
    let client = deploy_auction(&env, &admin);

    env.ledger().set_timestamp(1000);

    let id = client.create_auction(
        &seller,
        &token,
        &String::from_str(&env, "My Auction"),
        &1_000,
        &2000,
    );

    assert_eq!(id, 1);
    assert_eq!(client.get_auction_count(), 1);

    let auction = client.get_auction(&1);
    assert_eq!(auction.seller, seller);
    assert_eq!(auction.min_bid, 1_000);
}

#[test]
fn test_place_bid_and_auto_refund() {
    let (env, admin, seller, bidder1, bidder2) = setup_env();
    let token = deploy_token(&env, &admin);
    let client = deploy_auction(&env, &admin);

    env.ledger().set_timestamp(1000);

    let auction_id = client.create_auction(
        &seller,
        &token,
        &String::from_str(&env, "Refund Test"),
        &1_000,
        &9000,
    );

    fund_bidder(&env, &token, &admin, &bidder1, 5_000);
    fund_bidder(&env, &token, &admin, &bidder2, 10_000);

    let token_client = TokenClient::new(&env, &token);
    let contract_addr = client.address.clone();

    // bidder1 approves and bids
    token_client.approve(&bidder1, &contract_addr, &3_000, &10000);
    client.place_bid(&bidder1, &auction_id, &3_000);

    let b1_after_bid = token_client.balance(&bidder1);
    assert_eq!(b1_after_bid, 2_000); // 5000 - 3000

    // bidder2 outbids — bidder1 should be auto-refunded
    token_client.approve(&bidder2, &contract_addr, &5_000, &10000);
    client.place_bid(&bidder2, &auction_id, &5_000);

    let b1_after_refund = token_client.balance(&bidder1);
    assert_eq!(b1_after_refund, 5_000); // got full refund

    let auction = client.get_auction(&auction_id);
    assert_eq!(auction.highest_bid, 5_000);
    assert_eq!(auction.highest_bidder, Some(bidder2.clone()));
}

#[test]
fn test_finalize_sends_to_seller() {
    let (env, admin, seller, bidder1, _) = setup_env();
    let token = deploy_token(&env, &admin);
    let client = deploy_auction(&env, &admin);

    env.ledger().set_timestamp(1000);

    let auction_id = client.create_auction(
        &seller,
        &token,
        &String::from_str(&env, "Finalize Test"),
        &1_000,
        &5000,
    );

    fund_bidder(&env, &token, &admin, &bidder1, 10_000);
    let token_client = TokenClient::new(&env, &token);
    token_client.approve(&bidder1, &client.address, &4_000, &10000);
    client.place_bid(&bidder1, &auction_id, &4_000);

    let seller_before = token_client.balance(&seller);

    env.ledger().set_timestamp(6000); // past deadline
    client.finalize_auction(&auction_id);

    let seller_after = token_client.balance(&seller);
    assert_eq!(seller_after - seller_before, 4_000);

    let auction = client.get_auction(&auction_id);
    assert!(matches!(auction.status, AuctionStatus::Finalized));
}

#[test]
fn test_cancel_no_bids() {
    let (env, admin, seller, _, _) = setup_env();
    let token = deploy_token(&env, &admin);
    let client = deploy_auction(&env, &admin);

    env.ledger().set_timestamp(1000);

    let auction_id = client.create_auction(
        &seller,
        &token,
        &String::from_str(&env, "Cancel Test"),
        &500,
        &9000,
    );

    client.cancel_auction(&auction_id);

    let auction = client.get_auction(&auction_id);
    assert!(matches!(auction.status, AuctionStatus::Cancelled));
}

#[test]
fn test_cancel_with_bids_fails() {
    let (env, admin, seller, bidder1, _) = setup_env();
    let token = deploy_token(&env, &admin);
    let client = deploy_auction(&env, &admin);

    env.ledger().set_timestamp(1000);

    let auction_id = client.create_auction(
        &seller,
        &token,
        &String::from_str(&env, "No Cancel"),
        &500,
        &9000,
    );

    fund_bidder(&env, &token, &admin, &bidder1, 5_000);
    TokenClient::new(&env, &token).approve(&bidder1, &client.address, &1_000, &10000);
    client.place_bid(&bidder1, &auction_id, &1_000);

    let result = client.try_cancel_auction(&auction_id);
    assert_eq!(result, Err(Ok(ContractError::BidsExist)));
}

#[test]
fn test_bid_below_min_fails() {
    let (env, admin, seller, bidder1, _) = setup_env();
    let token = deploy_token(&env, &admin);
    let client = deploy_auction(&env, &admin);

    env.ledger().set_timestamp(1000);

    let auction_id = client.create_auction(
        &seller,
        &token,
        &String::from_str(&env, "Min Bid Test"),
        &5_000,
        &9000,
    );

    fund_bidder(&env, &token, &admin, &bidder1, 10_000);
    TokenClient::new(&env, &token).approve(&bidder1, &client.address, &100, &10000);

    let result = client.try_place_bid(&bidder1, &auction_id, &100);
    assert_eq!(result, Err(Ok(ContractError::BidTooLow)));
}
