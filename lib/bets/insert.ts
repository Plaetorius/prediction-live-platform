import { createSupabaseServerClient } from "../supabase/server";
import { Bet } from "../types";

export async function createBet(
  marketId: string,
  profileId: string,
  isAnswerA: boolean,
  amount: number,
  status: string = 'draft',
): Promise<Bet | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('bets')
      .insert({
        market_id: marketId,
        profile_id: profileId,
        is_answer_a: isAnswerA,
        amount: amount,
        status,
      })
      .select()
      .single()
      if (error) {
        console.error("Error creating bet:", error)
        return null
      }
      // Returned mainly for debugging purpose, might be removed later
      const bet: Bet = {
        id: data.id,
        profileId: data.profile_id,
        marketId: data.market_id,
        isAnswerA: data.is_answer_a,
        amount: data.amount,
        exitAmount: null,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        status: data.status
      }
      return bet

  } catch (e) {
    console.error("Error creating bet:", e)
    return null
  }
}