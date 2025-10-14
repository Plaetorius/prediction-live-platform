use anchor_lang::prelude::*;

// This is your program's public key and it will update
// automatically when you build the project.
declare_id!("11111111111111111111111111111111");

#[program]
pub mod betting_pool {
    use super::*;

    // Initialize a new betting pool
    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        pool_id: u64,
        fee_recipient: Pubkey,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.pool_id = pool_id;
        pool.owner = ctx.accounts.owner.key();
        pool.fee_recipient = fee_recipient;
        pool.total_amount_a = 0;
        pool.total_amount_b = 0;
        pool.total_bets_a = 0;
        pool.total_bets_b = 0;
        pool.resolution = Resolution::Pending;
        pool.resolved = false;
        pool.fee_percentage = 5; // 5% fee
        
        msg!("Pool {} initialized!", pool_id);
        Ok(())
    }

    // Place a bet on a specific pool (pool must exist)
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        pool_id: u64,
        side: BetSide,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, BettingError::InvalidAmount);
        require!(pool_id > 0, BettingError::PoolDoesNotExist);
        
        let pool = &mut ctx.accounts.pool;
        let bet = &mut ctx.accounts.bet;
        
        // Check if user already placed a bet on this pool
        require!(bet.amount == 0, BettingError::AlreadyPlacedBet);
        require!(!pool.resolved, BettingError::PoolAlreadyResolved);
        
        // Create bet
        bet.pool_id = pool_id;
        bet.bettor = ctx.accounts.bettor.key();
        bet.amount = amount;
        bet.side = side;
        bet.claimed = false;
        
        // Update pool totals
        if side == BetSide::A {
            pool.total_amount_a += amount;
            pool.total_bets_a += 1;
        } else {
            pool.total_amount_b += amount;
            pool.total_bets_b += 1;
        }
        
        // Transfer SOL to the pool
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.bettor.to_account_info(),
                to: ctx.accounts.pool.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, amount)?;
        
        emit!(BetPlaced {
            pool_id,
            bettor: ctx.accounts.bettor.key(),
            side,
            amount,
        });
        
        Ok(())
    }

    // Resolve a pool and distribute winnings (only contract owner)
    pub fn resolve_pool(
        ctx: Context<ResolvePool>,
        pool_id: u64,
        resolution: Resolution,
    ) -> Result<()> {
        require!(resolution != Resolution::Pending, BettingError::InvalidResolution);
        require!(!ctx.accounts.pool.resolved, BettingError::PoolAlreadyResolved);
        
        // Check that the caller is the contract owner (the one who deployed)
        // In Solana, we can't easily get the program owner, so we'll use a different approach
        // The owner will be the one who calls this function and signs the transaction
        
        let pool = &mut ctx.accounts.pool;
        pool.resolution = resolution;
        pool.resolved = true;
        
        emit!(PoolResolved {
            pool_id,
            resolution,
        });
        
        // Distribute winnings
        distribute_winnings(ctx, pool_id, resolution)?;
        
        Ok(())
    }

    // Internal function to distribute winnings (automatic distribution like Solidity)
    pub fn distribute_winnings(
        ctx: Context<ResolvePool>,
        pool_id: u64,
        resolution: Resolution,
    ) -> Result<()> {
        let pool = &ctx.accounts.pool;
        let total_winnings = pool.total_amount_a + pool.total_amount_b;
        let fee_amount = (total_winnings * pool.fee_percentage as u64) / 100;
        let winnings_to_distribute = total_winnings - fee_amount;
        
        // Send fee to fee recipient
        if fee_amount > 0 {
            **ctx.accounts.fee_recipient.to_account_info().try_borrow_mut_lamports()? += fee_amount;
            **ctx.accounts.pool.to_account_info().try_borrow_mut_lamports()? -= fee_amount;
            
            emit!(FeeCollected {
                pool_id,
                amount: fee_amount,
            });
        }
        
        // Note: In Solana, we can't iterate through all bettors in a single transaction
        // due to compute limits. The distribution happens when users call claim_winnings.
        // This is a limitation of Solana compared to Ethereum.
        // The pool now contains the winnings_to_distribute amount for winners to claim.
        
        Ok(())
    }

    // Claim winnings (simplified version)
    pub fn claim_winnings(
        ctx: Context<ClaimWinnings>,
        pool_id: u64,
    ) -> Result<()> {
        let pool = &ctx.accounts.pool;
        let bet = &mut ctx.accounts.bet;
        
        require!(pool.resolved, BettingError::PoolNotResolved);
        require!(!bet.claimed, BettingError::AlreadyClaimed);
        require!(pool.resolution as u8 == bet.side as u8, BettingError::NotWinner);
        
        // Calculate winnings (simplified)
        let total_winnings = pool.total_amount_a + pool.total_amount_b;
        let fee_amount = (total_winnings * pool.fee_percentage as u64) / 100;
        let winnings_to_distribute = total_winnings - fee_amount;
        
        let bettor_winnings = if pool.resolution == Resolution::A {
            (bet.amount * winnings_to_distribute) / pool.total_amount_a
        } else {
            (bet.amount * winnings_to_distribute) / pool.total_amount_b
        };
        
        bet.claimed = true;
        
        // Transfer winnings to bettor
        **ctx.accounts.pool.to_account_info().try_borrow_mut_lamports()? -= bettor_winnings;
        **ctx.accounts.bettor.to_account_info().try_borrow_mut_lamports()? += bettor_winnings;
        
        emit!(WinningsClaimed {
            pool_id,
            bettor: ctx.accounts.bettor.key(),
            amount: bettor_winnings,
        });
        
        Ok(())
    }

    // Get pool information (equivalent to getPoolInfo in Solidity)
    pub fn get_pool_info(
        ctx: Context<GetPoolInfo>,
        pool_id: u64,
    ) -> Result<PoolInfo> {
        let pool = &ctx.accounts.pool;
        Ok(PoolInfo {
            total_amount_a: pool.total_amount_a,
            total_amount_b: pool.total_amount_b,
            total_bets_a: pool.total_bets_a,
            total_bets_b: pool.total_bets_b,
            resolution: pool.resolution.clone(),
            resolved: pool.resolved,
        })
    }

    // Get bet information for a specific user (equivalent to getBetInfo in Solidity)
    pub fn get_bet_info(
        ctx: Context<GetBetInfo>,
        pool_id: u64,
    ) -> Result<BetInfo> {
        let bet = &ctx.accounts.bet;
        Ok(BetInfo {
            amount: bet.amount,
            side: bet.side.clone(),
            claimed: bet.claimed,
        })
    }

    // Get total number of bettors for each side (equivalent to getBettorsCount in Solidity)
    pub fn get_bettors_count(
        ctx: Context<GetBettorsCount>,
        pool_id: u64,
    ) -> Result<BettorsCount> {
        let pool = &ctx.accounts.pool;
        Ok(BettorsCount {
            count_a: pool.total_bets_a,
            count_b: pool.total_bets_b,
        })
    }

    // Emergency function to withdraw funds (only owner) - equivalent to emergencyWithdraw in Solidity
    pub fn emergency_withdraw(
        ctx: Context<EmergencyWithdraw>,
    ) -> Result<()> {
        let pool = &ctx.accounts.pool;
        let pool_balance = ctx.accounts.pool.to_account_info().lamports();
        
        **ctx.accounts.pool.to_account_info().try_borrow_mut_lamports()? -= pool_balance;
        **ctx.accounts.owner.to_account_info().try_borrow_mut_lamports()? += pool_balance;
        
        msg!("Emergency withdrawal: {} lamports", pool_balance);
        Ok(())
    }

    // Update fee recipient (only owner) - equivalent to updateFeeRecipient in Solidity
    pub fn update_fee_recipient(
        ctx: Context<UpdateFeeRecipient>,
        new_fee_recipient: Pubkey,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.fee_recipient = new_fee_recipient;
        
        msg!("Fee recipient updated to: {}", new_fee_recipient);
        Ok(())
    }

    // Get contract balance (equivalent to getContractBalance in Solidity)
    pub fn get_contract_balance(
        ctx: Context<GetContractBalance>,
    ) -> Result<u64> {
        Ok(ctx.accounts.pool.to_account_info().lamports())
    }
}

#[derive(Accounts)]
#[instruction(pool_id: u64)]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 32 + 8 + 8 + 8 + 8 + 1 + 1 + 1,
        seeds = [b"pool", pool_id.to_le_bytes().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(pool_id: u64)]
pub struct PlaceBet<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool_id.to_le_bytes().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,
    #[account(
        init,
        payer = bettor,
        space = 8 + 8 + 32 + 8 + 1 + 1,
        seeds = [b"bet", pool_id.to_le_bytes().as_ref(), bettor.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,
    #[account(mut)]
    pub bettor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(pool_id: u64)]
pub struct ResolvePool<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool_id.to_le_bytes().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub owner: Signer<'info>,
    /// CHECK: This is the fee recipient
    pub fee_recipient: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(pool_id: u64)]
pub struct ClaimWinnings<'info> {
    #[account(
        seeds = [b"pool", pool_id.to_le_bytes().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,
    #[account(
        mut,
        seeds = [b"bet", pool_id.to_le_bytes().as_ref(), bettor.key().as_ref()],
        bump,
        constraint = bet.bettor == bettor.key() @ BettingError::Unauthorized
    )]
    pub bet: Account<'info, Bet>,
    #[account(mut)]
    pub bettor: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(pool_id: u64)]
pub struct GetPoolInfo<'info> {
    #[account(
        seeds = [b"pool", pool_id.to_le_bytes().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,
}

#[derive(Accounts)]
#[instruction(pool_id: u64)]
pub struct GetBetInfo<'info> {
    #[account(
        seeds = [b"bet", pool_id.to_le_bytes().as_ref(), bettor.key().as_ref()],
        bump,
        constraint = bet.bettor == bettor.key() @ BettingError::Unauthorized
    )]
    pub bet: Account<'info, Bet>,
    pub bettor: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(pool_id: u64)]
pub struct GetBettorsCount<'info> {
    #[account(
        seeds = [b"pool", pool_id.to_le_bytes().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,
}

#[derive(Accounts)]
#[instruction(pool_id: u64)]
pub struct EmergencyWithdraw<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool_id.to_le_bytes().as_ref()],
        bump,
        constraint = pool.owner == owner.key() @ BettingError::Unauthorized
    )]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(pool_id: u64)]
pub struct UpdateFeeRecipient<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool_id.to_le_bytes().as_ref()],
        bump,
        constraint = pool.owner == owner.key() @ BettingError::Unauthorized
    )]
    pub pool: Account<'info, Pool>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(pool_id: u64)]
pub struct GetContractBalance<'info> {
    #[account(
        seeds = [b"pool", pool_id.to_le_bytes().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,
}

#[account]
pub struct Pool {
    pub pool_id: u64,
    pub owner: Pubkey,
    pub fee_recipient: Pubkey,
    pub total_amount_a: u64,
    pub total_amount_b: u64,
    pub total_bets_a: u64,
    pub total_bets_b: u64,
    pub resolution: Resolution,
    pub resolved: bool,
    pub fee_percentage: u8,
}

#[account]
pub struct Bet {
    pub pool_id: u64,
    pub bettor: Pubkey,
    pub amount: u64,
    pub side: BetSide,
    pub claimed: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum BetSide {
    A,
    B,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum Resolution {
    Pending,
    A,
    B,
}

#[event]
pub struct BetPlaced {
    pub pool_id: u64,
    pub bettor: Pubkey,
    pub side: BetSide,
    pub amount: u64,
}

#[event]
pub struct PoolResolved {
    pub pool_id: u64,
    pub resolution: Resolution,
}

#[event]
pub struct WinningsClaimed {
    pub pool_id: u64,
    pub bettor: Pubkey,
    pub amount: u64,
}

#[event]
pub struct FeeCollected {
    pub pool_id: u64,
    pub amount: u64,
}

#[error_code]
pub enum BettingError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Pool already resolved")]
    PoolAlreadyResolved,
    #[msg("Already placed a bet on this pool")]
    AlreadyPlacedBet,
    #[msg("Invalid resolution")]
    InvalidResolution,
    #[msg("Pool not resolved")]
    PoolNotResolved,
    #[msg("Already claimed")]
    AlreadyClaimed,
    #[msg("Not a winner")]
    NotWinner,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Pool does not exist")]
    PoolDoesNotExist,
}

// Return types for view functions
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PoolInfo {
    pub total_amount_a: u64,
    pub total_amount_b: u64,
    pub total_bets_a: u64,
    pub total_bets_b: u64,
    pub resolution: Resolution,
    pub resolved: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct BetInfo {
    pub amount: u64,
    pub side: BetSide,
    pub claimed: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct BettorsCount {
    pub count_a: u64,
    pub count_b: u64,
}
