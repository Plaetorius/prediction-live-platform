import { validateBettingPrerequisites } from "./validation"
import { createBetClient } from "../bets/insertClient"
import { preparePlaceBetTransaction } from "../web3/transactionService"
import { BetPayload } from "../types"
import { analyzeTransactionError } from "./errorHandling"

export interface BettingServiceParams {
  marketId: string | null
  profileId: string
  isAnswerA: boolean
  amount: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any
  isConnected: boolean
  chainId: number
  account: `0x${string}` | null
}

export interface BettingServiceResult {
  success: boolean
  error?: string
  requiresAction?: 'connect' | 'switchChain'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bet?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transactionParams?: any
}

export async function processBettingRequest({
  marketId,
  profileId,
  isAnswerA,
  amount,
  profile,
  isConnected,
  chainId,
  account
}: BettingServiceParams) {
  const validationResult = validateBettingPrerequisites({
    marketId,
    profile,
    isConnected,
    chainId
  })

  if (!validationResult.isValid) {
    return {
      success: false,
      error: validationResult.error,
      requiresAction: validationResult.requiresAction
    }
  }
  const bet = await createBetClient(
    marketId!,
    profileId,
    isAnswerA,
    amount,
    'draft'
  )

  if (!bet) {
    return {
      success: false, 
      error: "Error creating bet. Please try again."
    }
  }
  const transactionResult = preparePlaceBetTransaction({
    marketId: marketId!,
    isAnswerA,
    amount,
    account
  })

  if (!transactionResult.success) {
    return {
      success: false,
      error: transactionResult.error
    }
  }

  return  {
    success: true,
    bet,
    transactionParams: transactionResult.transactionParams
  }
}

export function createBetPayload(
  marketId: string,
  profileId: string,
  amount: number,
  createdAt: string,
  betId: string,
  isAnswerA: boolean
): BetPayload {
  return {
    marketId,
    profileId,
    amount,
    createdAt,
    betId,
    isAnswerA
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleTransactionError(error: any) {
  const errorAnalysis = analyzeTransactionError(error)

  return {
    userMessage: errorAnalysis.userMessage,
    shouldUpdateBetStatus: errorAnalysis.shouldUpdateBetStatus,
    errorCode: errorAnalysis.errorCode,
  }
}