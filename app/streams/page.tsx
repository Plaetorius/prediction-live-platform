"use client"

import React, { useEffect, useState } from 'react'
import { Stream } from '@/lib/types'
import { boolean } from 'zod'
import { createSupabaseClient } from '@/lib/supabase/client'


export default function Streams() {
  const [loading, setLoading] = useState<boolean>(false)
  const [streams, setStreams] = useState<Stream[]>([])

  useEffect(() => {
    async function getStreams() {
      const supabase = createSupabaseClient()

      const { data, error } = await supabase
        .from('streams')
        .select()
    }
  }, [])

  return (
    <>
      <div>Streams</div>
      <div>
        This page will contain all the streams supported atm by PredictionLive
      </div>
    </>
  )
}
