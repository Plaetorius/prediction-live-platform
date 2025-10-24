import { keccak256, parseEther, toHex } from "viem"
import { BETTING_POOL_ADDRESS, BettingPoolABI } from "../contracts/BettingPoolABI"

export interface PlaceBetTransactionParams {
  marketId: string
  isAnswerA: boolean
  amount: number
  account: `0x${string}` | null
}

export interface PlaceBetTransactionResult {
  success: boolean
  error?: string
  transactionParams?: {
    address: `0x${string}`
    abi: readonly unknown[]
    functionName: string
    args: readonly unknown[]
    value: bigint
    account: `0x${string}` | null
  }
}

export function preparePlaceBetTransaction({
  marketId,
  isAnswerA,
  amount,
  account
}: PlaceBetTransactionParams): PlaceBetTransactionResult {
  try {
    const poolId = BigInt(keccak256(toHex(marketId)).slice(0, 10))

    const transactionParams = {
      address: BETTING_POOL_ADDRESS,
      abi: BettingPoolABI,
      functionName: "placeBet",
      args: [
        poolId,
        isAnswerA? 0 : 1
      ],
      value: parseEther(amount.toString()),
      account,
    }
    return {
      success: true,
      transactionParams,
    }
  } catch (error) {
    console.error("Error preparing transaction:", error)
    return {
      success: false,
      error: "Failed to prepare transaction"
    }
  }
}