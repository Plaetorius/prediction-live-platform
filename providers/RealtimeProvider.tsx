'use client'

import { ReactNode, useEffect, useState } from "react";
import { useProfile } from "./ProfileProvider";
import { RealtimeChannel } from "@supabase/supabase-js";
import { createSupabaseClient } from "@/lib/supabase/client";

interface RealtimeContextType {

}

type RealtimeStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile()
  const [connectionStatus, setConnectionStatus] = useState<RealtimeStatus>('disconnected')
  const [subscriptions, setSubscriptions] = useState<Map<string, RealtimeChannel>>(new Map())

  const canBet = !!profile
  const canAdmin = profile?.role === 'admin'

  useEffect(() => {
    const connect = async () => {
      try {
        setConnectionStatus('connecting')
        const supabase = await createSupabaseClient()

        // Public channel (Tier 1) - Always connected
        const publicChannel = supabase.channel('public', {
          config: { 
            broadcast: { self: false },
            presence: { key: 'public' }
          }
        })

      } catch {

      } finally {

      }
    }
    connect()
  }, [])
}