import { createSupabaseClient } from "../supabase/client";
import { Bet } from "../types";

export async function selectBetsWithMarketId(marketId: string): Promise<Bet[] | null> {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('bets')
      .select()
      .eq('market_id', marketId)

    if (error)
      throw error

    const bets: Bet[] = data.map((bet) => {
      return {
        id: bet.id,
        profileId: bet.profile_id,
        marketId: bet.market_id,
        isAnswerA: bet.is_answer_a,
        createdAt: bet.created_at,
        updatedAt: bet.updated_at,
        amount: bet.amount,
        status: bet.status,
      }
    })

    return bets

  } catch (error) {
    console.error("Error fetching bets for marketId:", error)
    return null
  }
}