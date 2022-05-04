use cosmwasm_std::{Addr, Binary, Coin, Timestamp, Uint128};
use cw_storage_plus::{Bound, Item, Map};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Config {
    /// admin address for configuration activities
    pub admin_address: Addr,
    /// contract address of Fury token
    pub custom_token_address: Addr,
    
    /// discount_rate when fury and UST are both provided
    pub pair_discount_rate: u16,
    /// bonding period when fury and UST are both provided in seconds
    pub pair_bonding_period_in_sec: u64,
    /// Fury tokens for balanced investment will be fetched from this wallet
    pub pair_fury_reward_wallet: Addr,
    /// The LP tokens for all liquidity providers except
    /// authorised_liquidity_provider will be stored to this address
    /// The LPTokens for balanced investment are delivered to this wallet
    pub pair_lp_tokens_holder: Addr,

    /// discount_rate when only UST are both provided
    pub native_discount_rate: u16,
    /// bonding period when only UST provided
    pub native_bonding_period_in_sec: u64,
    /// Fury tokens for native(UST only) investment will be fetched from this wallet
    pub native_investment_reward_wallet: Addr,
    /// The native(UST only) investment will be stored into this wallet
    pub native_investment_receive_wallet: Addr,    

    /// This address has the authority to pump in liquidity
    /// The LP tokens for this address will be returned to this address
    pub authorized_liquidity_provider: Addr,

    ///Time in nano seconds since EPOC when the swapping will be enabled
    pub swap_opening_date: Timestamp,
    
    /// Pool pair address from liquidity provider (astroport)
    pub pool_pair_address: String,
    /// LP token contract address
    pub liquidity_token: Addr,

    pub platform_fees_collector_wallet: Addr,
    ///Specified in percentage multiplied by 100, i.e. 100% = 10000 and 0.01% = 1
    pub platform_fees: Uint128,
    ///Specified in percentage multiplied by 100, i.e. 100% = 10000 and 0.01% = 1
    pub transaction_fees: Uint128,
    ///Specified in percentage multiplied by 100, i.e. 100% = 10000 and 0.01% = 1
    pub swap_fees: Uint128,
}
// put the length bytes at the first for compatibility with legacy singleton store
pub const CONFIG: Item<Config> = Item::new("\u{0}\u{6}config");

pub const CONTRACT: Item<ContractVersion> = Item::new("contract_info");

#[derive(Serialize, Deserialize, Clone, PartialEq, JsonSchema, Debug)]
pub struct ContractVersion {
    /// contract is the crate name of the implementing contract, eg. `crate:cw20-base`
    /// we will use other prefixes for other languages, and their standard global namespacing
    pub contract: String,
    /// version is any string that this implementation knows. It may be simple counter "1", "2".
    /// or semantic version on release tags "v0.7.0", or some custom feature flag list.
    /// the only code that needs to understand the version parsing is code that knows how to
    /// migrate from the given contract (and is tied to it's implementation somehow)
    pub version: String,
}

/// This is used for saving pending request details
#[derive(Serialize, Deserialize, Clone, PartialEq, JsonSchema, Debug)]
#[serde(rename_all = "snake_case")]
pub enum SubMessageType {
    TransferFromSubMsg,
    IncreaseAlowanceSubMsg,
    ProvideLiquiditySubMsg,
}

/// This is used for saving pending request details
#[derive(Serialize, Deserialize, Clone, PartialEq, JsonSchema, Debug)]
#[serde(rename_all = "snake_case")]
pub enum SubMessageNextAction {
    TransferNativeAssets,
    TransferCustomAssets,
    IncreaseAllowance,
    ProvideLiquidity,
    TransferCustomAssetsFromFundsOwner,
    TransferToNativeInvestmentReceiveWallet,
}

/// This is used for saving pending request details
#[derive(Serialize, Deserialize, Clone, PartialEq, JsonSchema, Debug)]
#[serde(rename_all = "snake_case")]
pub struct SubMessageDetails {
    /// id of request sent to astroport contract
    pub sub_req_id: String,

    /// Name of the request type
    pub request_type: SubMessageType,

    pub next_action: SubMessageNextAction,

    pub sub_message_payload: Binary,

    pub funds: Vec<Coin>,

	pub user_address: String,

	pub is_fury_provided: bool,
}
/// Map of request and list of their bonds. the key is request id and the
/// Value jsonified request
pub const SUB_MESSAGE_DETAILS: Map<String, SubMessageDetails> = Map::new("pending_request_details");


/// This is used for saving various bond details
#[derive(Serialize, Deserialize, Clone, PartialEq, JsonSchema, Debug, Default)]
#[serde(rename_all = "snake_case")]
pub struct BondedRewardsDetails {
    /// Address of the user wallet
    pub user_address: String,

    /// reward amount acrrued for this bond in quantity of tokens
    pub bonded_amount: Uint128,

    pub bonding_period: u64,

    pub bonding_start_timestamp : Timestamp,
}
/// Map of users and list of their bonded rewards. the key is user name and the
/// BondedRewardDetails will contain information about the users and rewards
pub const BONDED_REWARDS_DETAILS: Map<String, Vec<BondedRewardsDetails>> =
    Map::new("bonded_rewards_details");


pub const SUB_REQ_ID: Item<u64> = Item::new("sub_req_id");
