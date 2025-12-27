pub mod error;
pub mod instructions;
pub mod states;
use instructions::*;

use anchor_lang::prelude::*;
use states::*;

declare_id!("GzAS92jsBx8yc6A8hPBqreoSQXvAbteR3bemuGD48khZ");

pub mod admin {
    use super::{pubkey, Pubkey};
    pub const ID: Pubkey = pubkey!("DQLHM3qF5BBsBj2EKzbe8AXHVxPGsFeRVcBwaAnRcs8o");
}

#[program]
pub mod raydium_clone {
    use super::*;

    pub fn create_amm_config(
        ctx: Context<CreateAmmConfig>,
        index: u16,
        tick_spacing: u16,
        trade_fee_rate: u32,
        protocol_fee_rate: u32,
        fund_fee_rate: u32,
    ) -> Result<()> {
        assert!(trade_fee_rate < FEE_RATE_DENOMINATOR_VALUE);
        assert!(protocol_fee_rate <= FEE_RATE_DENOMINATOR_VALUE);
        assert!(fund_fee_rate <= FEE_RATE_DENOMINATOR_VALUE);
        assert!(fund_fee_rate + protocol_fee_rate <= FEE_RATE_DENOMINATOR_VALUE);
        instructions::create_amm_config(
            ctx,
            index,
            tick_spacing,
            trade_fee_rate,
            protocol_fee_rate,
            fund_fee_rate,
        )
    }

    pub fn update_amm_config(ctx: Context<UpdateAmmConfig>, param: u8, value: u32) -> Result<()> {
        instructions::update_amm_config(ctx, param, value)
    }
}
