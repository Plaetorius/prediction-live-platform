'use client'

import { topicBetStream } from "@/lib/realtimeTopic";
import { createSupabaseClient } from "@/lib/supabase/client";
import { BetListeners, BetChannelOptions } from "@/lib/types";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef } from "react";

export function useBetChannel(
  platform: string,
  name: string,
  listeners: BetListeners = {},
  opts: BetChannelOptions = {}
) {
  const supabase = createSupabaseClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  
  useEffect(() => {
    if (!platform || !name)
      return

    const topic = topicBetStream(platform, name, opts.kind || 'all')

    const channel = supabase.channel(topic, {
      config: { broadcast: { self: opts.broadcastSelf ?? true } }
    })
    
    if (listeners.onTeam1) {
      channel.on('broadcast', { event: 'bet_team1' }, (msg) => listeners.onTeam1?.(msg.payload))
    }

    if (listeners.onTeam2) {
      channel.on('broadcast', { event: 'bet_team2' }, (msg) => listeners.onTeam2?.(msg.payload))
    }

    channel.subscribe()
    channelRef.current = channel

    return () => {
      if (channelRef.current)
        supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [platform, name])

  function send<T = any>(event: string, payload: T) {
    const serializedPayload = JSON.parse(JSON.stringify(payload))
    channelRef.current?.send({ type: 'broadcast', event, payload: serializedPayload })
  }

  function sendBetTeam1(payload: any = {}) {
    send('bet_team1', payload)
  }

  function sendBetTeam2(payload: any = []) {
    send('bet_team2', payload)
  }

  return {
    channelRef,
    send,
    sendBetTeam1,
    sendBetTeam2
  }
}