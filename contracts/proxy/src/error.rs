use cosmwasm_std::{StdError, Uint128};
use thiserror::Error;

#[derive(Error, Debug, PartialEq)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),
    
    #[error("Unauthorized")]
    Unauthorized {},
    
    #[error("Fees received = {received}uusd whereas required = {required}uusd")]
    InsufficientFees {
        received: Uint128,
        required: Uint128,
        #[cfg(feature = "backtraces")]
        backtrace: Backtrace,
    },
}
