"use client"

import { createSupabaseClient } from "@/lib/supabase/client";
import { ResultListeners } from "@/lib/types";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef } from "react";

export function useResultChannel(listeners: ResultListeners = {}) {
  const supabase = createSupabaseClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

    useEffect(() => {
      const topic = 'results'

      const channel = supabase.channel(topic, {
        config: {
          broadcast: {
            self: false
          }
        }
      })

      if (listeners.onResult) {
        channel.on('broadcast', { event: 'result' }, (msg) => listeners.onResult?.(msg.payload))
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
    }, [listeners.onResult])


    function send<T = any>(event: string, payload: T) {
      const serializedPayload = JSON.parse(JSON.stringify(payload))
      channelRef.current?.send({ type: 'broadcast', event, payload: serializedPayload })
    }

    function sendResult(payload: any = {}) {
      send('result', payload)
    }

    return {
      channelRef,
      send,
      sendResult
    }
}