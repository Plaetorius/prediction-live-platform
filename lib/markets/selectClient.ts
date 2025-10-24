import { createSupabaseClient } from "../supabase/client";
import { now } from "../timezoneUtils";
import { Market } from "../types";
import { mapMarketSupaToTS } from "../mappings";

/**
 * Get all the opened markets for a specific stream based on the now() time and the 'est_end_time'
 * @param streamId Id of the stream to get the markets from
 * @returns Array of Market where the 'est_end_time' is greater than now()
 */
export async function selectOpenMarketsByStream(streamId: string): Promise<Market[] | null> {
  try {
    const supabase = createSupabaseClient()
    const currentTime = now()
    const { data, error } = await supabase
      .from('markets')
      .select()
      .eq('stream_id', streamId)
      .lt('start_time', currentTime)
      .gt('est_end_time', currentTime)

    if (error) {
      console.error("Error selecting open markets", error)
      return null
    }

    const openMarkets = data?.map(mapMarketSupaToTS)
    
    return openMarkets
  } catch (e) {
    console.error('Error selecting open markets:', e)
    return null
  }
}

/**
 * Get markets that a user has bets on
 * @param profileId ID of the profile to get markets for
 * @returns Array of Market that the user has bets on
 */
export async function selectMarketsByUserBets(profileId: string): Promise<Market[] | null> {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('markets')
      .select(`
        *,
        bets!inner(profile_id)
      `)
      .eq('bets.profile_id', profileId)

    if (error) {
      console.error("Error selecting markets by user bets", error)
      return null
    }

    const markets = data?.map(mapMarketSupaToTS)
    return markets
  } catch (e) {
    console.error('Error selecting markets by user bets:', e)
    return null
  }
}

/**
 * Get markets from streams that a user follows
 * @param profileId ID of the profile to get markets for
 * @returns Array of Market from streams the user follows
 */
export async function selectMarketsByFollowedStreams(profileId: string): Promise<Market[] | null> {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('markets')
      .select(`
        *,
        streams!inner(
          stream_follows!inner(profile_id)
        )
      `)
      .eq('streams.stream_follows.profile_id', profileId)

    if (error) {
      console.error("Error selecting markets by followed streams", error)
      return null
    }

    const markets = data?.map(mapMarketSupaToTS)
    return markets
  } catch (e) {
    console.error('Error selecting markets by followed streams:', e)
    return null
  }
}

/**
 * Get markets from specific stream IDs
 * @param streamIds Array of stream IDs to get markets for
 * @returns Array of Market from the specified streams
 */
export async function selectMarketsByStreamIds(streamIds: string[]): Promise<Market[] | null> {
  try {
    if (streamIds.length === 0) return []
    
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .in('stream_id', streamIds)

    if (error) {
      console.error("Error selecting markets by stream IDs", error)
      return null
    }

    const markets = data?.map(mapMarketSupaToTS)
    return markets
  } catch (e) {
    console.error('Error selecting markets by stream IDs:', e)
    return null
  }
}

/**
 * Get all open markets (for discovery) - updated version without streamId filter
 * @returns Array of Market where the 'est_end_time' is greater than now()
 */
export async function selectOpenMarkets(): Promise<Market[] | null> {
  try {
    const supabase = createSupabaseClient()
    const currentTime = now()
    const { data, error } = await supabase
      .from('markets')
      .select()
      .lt('start_time', currentTime)
      .gt('est_end_time', currentTime)

    if (error) {
      console.error("Error selecting open markets", error)
      return null
    }

    const openMarkets = data?.map(mapMarketSupaToTS)
    return openMarkets
  } catch (e) {
    console.error('Error selecting open markets:', e)
    return null
  }
}