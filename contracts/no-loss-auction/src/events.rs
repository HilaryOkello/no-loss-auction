use soroban_sdk::{contracttype, Address, Env, Symbol};

pub fn auction_created(env: &Env, auction_id: u64, seller: Address, min_bid: i128, deadline: u64) {
    let topics = (Symbol::new(env, "auction_created"), auction_id);
    env.events().publish(topics, (seller, min_bid, deadline));
}

pub fn bid_placed(env: &Env, auction_id: u64, bidder: Address, amount: i128) {
    let topics = (Symbol::new(env, "bid_placed"), auction_id);
    env.events().publish(topics, (bidder, amount));
}

pub fn refund_sent(env: &Env, auction_id: u64, bidder: Address, amount: i128) {
    let topics = (Symbol::new(env, "refund_sent"), auction_id);
    env.events().publish(topics, (bidder, amount));
}

pub fn auction_finalized(env: &Env, auction_id: u64, winner: Address, amount: i128) {
    let topics = (Symbol::new(env, "auction_finalized"), auction_id);
    env.events().publish(topics, (winner, amount));
}

pub fn auction_cancelled(env: &Env, auction_id: u64) {
    let topics = (Symbol::new(env, "auction_cancelled"), auction_id);
    env.events().publish(topics, ());
}
