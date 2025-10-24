import { Profile } from "../types"
import { SUPPORTED_CHAINS } from "@/providers/ProfileProvider"

export interface BettingValidationResult {
  isValid: boolean
  error?: string
  requiresAction?: 'connect' | 'switchChain'
}

export interface BettingValidationParams {
  marketId: string | null
  profile: Profile | null
  isConnected: boolean
  chainId: number
}

export function validateBettingPrerequisites({
  marketId,
  profile,
  isConnected,
  chainId
}: BettingValidationParams): BettingValidationResult {
  if (!marketId) {
    return {
      isValid: false,
      error: "Couldn't find market. Please try again."
    }
  }

  if (!profile) {
    return {
      isValid: false,
      error: "Couldn't find profile. Please try again."
    }
  }

  if (!isConnected) {
    return {
      isValid: false,
      error: "Please connect your wallet first.",
      requiresAction: 'connect'
    }
  }

  if (chainId !== SUPPORTED_CHAINS.BASE_SEPOLIA) {
    return {
      isValid: false,
      error: "Switching to Base Sepolia",
      requiresAction: 'switchChain'
    }
  }
  return { isValid: true }
}
