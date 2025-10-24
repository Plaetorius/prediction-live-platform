import { createSupabaseClient } from "../supabase/client";
import { now } from "../timezoneUtils";
import { Market } from "../types";

/**
 * Get all the opened markets based on the now() time and the 'est_end_time'
 * @param streamId Id of the stream to get the markets from
 * @returns Array of Market where status is 'open', start_time < now(), and est_end_time > now(), ordered by created_at desc (newest first)
 */
export async function selectOpenMarkets(streamId: string): Promise<Market[] | null> {
  try {
    const supabase = createSupabaseClient()
    const currentTime = now()
    const { data, error } = await supabase
      .from('markets')
      .select()
      .eq('stream_id', streamId)
      .eq('status', 'open')
      .lt('start_time', currentTime)
      .gt('est_end_time', currentTime)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error selecting open markets", error)
      return null
    }

    const openMarkets = data?.map((market) => {
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
        createdAt: new Date(market.created_at),
        updatedAt: new Date(market.updated_at),
      }
    })
    
    return openMarkets
  } catch (e) {
    console.error('Error selecting open markets:', e)
    return null
  }
}