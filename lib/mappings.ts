import { Bet } from "./types";

export function mapBetSupaToTS(bet: any): Bet {
  return {
    id: bet.profile_id,
    profileId: bet.profile_id,
    marketId: bet.market_id,
    isAnswerA: bet.is_answer_a,
    createdAt: new Date(bet.created_at),
    updatedAt: new Date(bet.updated_at),
    amount: bet.amount,
    exitAmount: bet.exit_amount,
    status: bet.status,
  }
}