/**
 * Calculate winnings based on the BettingPool contract logic
 * 
 * Contract logic:
 * - 5% fee is taken from total pool
 * - Remaining 95% is distributed proportionally to winners
 * - Winners get: (their bet amount / total winning side amount) * winnings to distribute
 */

export interface PoolInfo {
  totalAmountA: number
  totalAmountB: number
  resolution: 'A' | 'B'
}

export interface BetInfo {
  amount: number
  side: 'A' | 'B'
}

export interface WinningsResult {
  isWinner: boolean
  winnings: number
  profit: number
  feeAmount: number
}

const FEE_PERCENTAGE = 5 // 5% fee as defined in contract

export function calculateWinnings(
  betInfo: BetInfo,
  poolInfo: PoolInfo
): WinningsResult {
  const { amount: betAmount, side: betSide } = betInfo
  const { totalAmountA, totalAmountB, resolution } = poolInfo
  
  const totalPool = totalAmountA + totalAmountB
  const feeAmount = (totalPool * FEE_PERCENTAGE) / 100
  const winningsToDistribute = totalPool - feeAmount
  
  // Check if user is on the winning side
  const isWinner = betSide === resolution
  
  if (!isWinner) {
    return {
      isWinner: false,
      winnings: 0,
      profit: -betAmount, // User loses their bet amount
      feeAmount: 0
    }
  }
  
  // Calculate winnings for winner
  const winningSideTotal = resolution === 'A' ? totalAmountA : totalAmountB
  
  if (winningSideTotal === 0) {
    return {
      isWinner: true,
      winnings: 0,
      profit: -betAmount,
      feeAmount: 0
    }
  }
  
  // Calculate proportional winnings
  const winnings = (betAmount * winningsToDistribute) / winningSideTotal
  const profit = winnings - betAmount
  
  return {
    isWinner: true,
    winnings,
    profit,
    feeAmount
  }
}

/**
 * Format winnings for display
 */
export function formatWinnings(winnings: number, decimals: number = 4): string {
  return winnings.toFixed(decimals)
}

/**
 * Format profit for display (with + or - sign)
 */
export function formatProfit(profit: number, decimals: number = 4): string {
  const sign = profit >= 0 ? '+' : ''
  return `${sign}${profit.toFixed(decimals)}`
}
