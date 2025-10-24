import { Bet, Market } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMarketSupaToTS(market: any): Market {
  return {
    id: market.id,
    question: market.question,
    answerA: market.answer_a,
    answerB: market.answer_b,
    startTime: market.start_time,
    estEndTime: market.est_end_time,
    realEndTime: market.real_end_time,
    status: market.status,
    duration: market.duration,
    streamId: market.stream_id,
    isAnswerA: market.is_answer_a,
    createdAt: new Date(market.created_at),
    updatedAt: new Date(market.updated_at),
  }
}