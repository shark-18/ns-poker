use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("your_program_id");

#[program]
pub mod solana_escrow {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        buy_in_amount: u64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.buy_in_amount = buy_in_amount;
        escrow.authority = ctx.accounts.authority.key();
        escrow.token_mint = ctx.accounts.token_mint.key();
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(
            amount == ctx.accounts.escrow.buy_in_amount,
            EscrowError::InvalidAmount
        );

        // Transfer tokens from player to escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.player_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.player.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        Ok(())
    }

    pub fn close(ctx: Context<Close>, winners: Vec<Pubkey>, shares: Vec<u8>) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.escrow.authority,
            EscrowError::Unauthorized
        );
        require!(winners.len() == shares.len(), EscrowError::InvalidShares);
        require!(
            shares.iter().sum::<u8>() == 100,
            EscrowError::InvalidShares
        );

        let escrow_token_account = &ctx.accounts.escrow_token_account;
        let balance = escrow_token_account.amount;

        // Distribute winnings
        for (i, winner) in winners.iter().enumerate() {
            let share = (balance as u128)
                .checked_mul(shares[i] as u128)
                .unwrap()
                .checked_div(100)
                .unwrap() as u64;

            // Transfer tokens to winner
            let cpi_accounts = Transfer {
                from: escrow_token_account.to_account_info(),
                to: ctx.accounts.winner_token_accounts[i].to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            };

            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(
                cpi_program,
                cpi_accounts,
                &[&[b"escrow", &[ctx.bumps.escrow]]],
            );
            token::transfer(cpi_ctx, share)?;
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Escrow::LEN,
        seeds = [b"escrow"],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_mint: Account<'info, token::Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub player_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    pub player: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    /// CHECK: This is safe as we verify the authority
    pub authority: Signer<'info>,
    /// CHECK: These are the winner token accounts
    #[account(mut)]
    pub winner_token_accounts: Vec<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Escrow {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub buy_in_amount: u64,
}

impl Escrow {
    pub const LEN: usize = 32 + 32 + 8;
}

#[error_code]
pub enum EscrowError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid shares")]
    InvalidShares,
} 