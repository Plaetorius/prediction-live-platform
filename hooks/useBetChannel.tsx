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
    
    if (listeners.onTeamA) {
      channel.on('broadcast', { event: 'bet_team_a' }, (msg) => listeners.onTeamA?.(msg.payload))
    }

    if (listeners.onTeamB) {
      channel.on('broadcast', { event: 'bet_team_b' }, (msg) => listeners.onTeamB?.(msg.payload))
    }

    if (listeners.onNewMarket) {
      channel.on('broadcast', { event: 'new_market'}, (msg) => listeners.onNewMarket?.(msg.payload))
    }

    channel.subscribe()
    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        supabase.removeChannel(channelRef.current)
      }
      channelRef.current = null
    }
  }, [platform, name, listeners.onTeamA, listeners.onTeamB, listeners.onNewMarket, opts.kind, opts.broadcastSelf])

  function send<T = any>(event: string, payload: T) {
    const serializedPayload = JSON.parse(JSON.stringify(payload))
    channelRef.current?.send({ type: 'broadcast', event, payload: serializedPayload })
  }

  function sendBetTeam1(payload: any = {}) {
    send('bet_team_a', payload)
  }

  function sendBetTeam2(payload: any = []) {
    send('bet_team_b', payload)
  }

  function sendNewMarket(payload: any = []) {
    send('new_market', payload)
  }

  return {
    channelRef,
    send,
    sendBetTeam1,
    sendBetTeam2,
    sendNewMarket
  }
}