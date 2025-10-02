import { createSupabaseServerClient } from "../supabase/server";
import { Bet } from "../types";

export async function selectBetsWithMarketId(marketId: string) : Promise<Bet[] | null> {
  try {

    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .eq('market_id', marketId)

    if (error) 
      throw error

    const bets: Bet[] = data.map((bet) => {
      return {
        id: bet.id,
        profileId: bet.profile_id,
        marketId: bet.market_id,
        isAnswerA: bet.is_answer_a,
        amount: bet.amount,
        createdAt: new Date(bet.created_ad),
        updatedAt: new Date(bet.updated_at),
        status: bet.status,
      }
    })
    return bets
  } catch (error) {
    console.error("Error retrieving bets for marketId:", marketId)
    return null
  }
  

}