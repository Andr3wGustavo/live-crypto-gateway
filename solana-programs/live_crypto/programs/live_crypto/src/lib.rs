use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"); // Default localnet placeholder ID

#[program]
pub mod live_crypto {
    use super::*;

    pub fn donate_native(ctx: Context<DonateNative>, amount: u64, fee_percentage: u64) -> Result<()> {
        let total_amount = amount;
        let fee_amount = (total_amount * fee_percentage) / 10000;
        let net_amount = total_amount - fee_amount;

        // Transfer fee to treasury
        if fee_amount > 0 {
            let ix_fee = anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.donor.key(),
                &ctx.accounts.treasury.key(),
                fee_amount,
            );
            anchor_lang::solana_program::program::invoke(
                &ix_fee,
                &[
                    ctx.accounts.donor.to_account_info(),
                    ctx.accounts.treasury.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }

        // Transfer net amount to streamer
        let ix_net = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.donor.key(),
            &ctx.accounts.streamer.key(),
            net_amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix_net,
            &[
                ctx.accounts.donor.to_account_info(),
                ctx.accounts.streamer.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        msg!("Donation of {} lamports processed. Fee: {}, Net: {}", total_amount, fee_amount, net_amount);
        Ok(())
    }

    pub fn donate_spl(ctx: Context<DonateSPL>, amount: u64, fee_percentage: u64) -> Result<()> {
        let total_amount = amount;
        let fee_amount = (total_amount * fee_percentage) / 10000;
        let net_amount = total_amount - fee_amount;

        // Transfer fee to treasury
        if fee_amount > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.donor_token_account.to_account_info(),
                to: ctx.accounts.treasury_token_account.to_account_info(),
                authority: ctx.accounts.donor.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::transfer(cpi_ctx, fee_amount)?;
        }

        // Transfer net amount to streamer
        let cpi_accounts_streamer = Transfer {
            from: ctx.accounts.donor_token_account.to_account_info(),
            to: ctx.accounts.streamer_token_account.to_account_info(),
            authority: ctx.accounts.donor.to_account_info(),
        };
        let cpi_program_streamer = ctx.accounts.token_program.to_account_info();
        let cpi_ctx_streamer = CpiContext::new(cpi_program_streamer, cpi_accounts_streamer);
        token::transfer(cpi_ctx_streamer, net_amount)?;

        msg!("SPL Donation of {} tokens processed. Fee: {}, Net: {}", total_amount, fee_amount, net_amount);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct DonateNative<'info> {
    #[account(mut)]
    pub donor: Signer<'info>,
    /// CHECK: Streamer receives funds
    #[account(mut)]
    pub streamer: AccountInfo<'info>,
    /// CHECK: Treasury receives fee
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DonateSPL<'info> {
    #[account(mut)]
    pub donor: Signer<'info>,
    #[account(mut)]
    pub donor_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub streamer_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
