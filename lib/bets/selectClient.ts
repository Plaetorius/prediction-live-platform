import { createSupabaseClient } from "../supabase/client";
import { Bet } from "../types";
import { mapBetSupaToTS } from "../mappings";

export async function selectBetsWithMarketId({ 
  marketId,
  status
}: {
  marketId: string,
  status?: string
}): Promise<Bet[] | null> {
  try {
    const supabase = createSupabaseClient()
    let query = supabase
      .from('bets')
      .select()
      .eq('market_id', marketId)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error)
      throw error

    if (!data)
      return null

    const bets: Bet[] = data.map(mapBetSupaToTS)

    return bets

  } catch (error) {
    console.error("Error fetching bets for marketId:", error)
    return null
  }
}

/**
 * Get all bets for a specific user/profile
 * @param profileId ID of the profile to get bets for
 * @param status Optional status filter
 * @returns Array of Bet for the specified user
 */
export async function selectBetsByUser({ 
  profileId,
  status
}: {
  profileId: string,
  status?: string
}): Promise<Bet[] | null> {
  try {
    const supabase = createSupabaseClient()
    let query = supabase
      .from('bets')
      .select()
      .eq('profile_id', profileId)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error)
      throw error

    if (!data)
      return null

    const bets: Bet[] = data.map(mapBetSupaToTS)
    return bets

  } catch (error) {
    console.error("Error fetching bets for user:", error)
    return null
  }
}

/**
 * Get bets for multiple markets
 * @param marketIds Array of market IDs to get bets for
 * @param status Optional status filter
 * @returns Array of Bet for the specified markets
 */
export async function selectBetsByMarkets({ 
  marketIds,
  status
}: {
  marketIds: string[],
  status?: string
}): Promise<Bet[] | null> {
  try {
    if (marketIds.length === 0) return []
    
    const supabase = createSupabaseClient()
    let query = supabase
      .from('bets')
      .select()
      .in('market_id', marketIds)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error)
      throw error

    if (!data)
      return null

    const bets: Bet[] = data.map(mapBetSupaToTS)
    return bets

  } catch (error) {
    console.error("Error fetching bets for markets:", error)
    return null
  }
}