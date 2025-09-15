"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'
import { MessageCircleCode, SquarePlus } from 'lucide-react'
import { useParams } from 'next/navigation'
import React, { useEffect, useRef } from 'react'

function setupListeners(channel: RealtimeChannel) {
  channel.on('broadcast', { event: 'bet_team1'}, (payload) => {
    console.log("BET TEAM1", payload)
  })
  channel.on('broadcast', { event: 'bet_team2' }, (payload) => {
    console.log("BET TEAM2", payload)
  })
}

export default function StreamPage() {
  const { platform, stream } = useParams()
  const supabase = createSupabaseClient()
  const streamChannelRef = useRef<any>(null)

  useEffect(() => {
    const streamChannel = supabase.channel(`${platform}-${stream}`, {
      config: {
        broadcast: {
          self: true
        }
      }
    })

    setupListeners(streamChannel)
    streamChannel.subscribe()

    streamChannelRef.current = streamChannel

    // Cleanup function
    return () => {
      if (streamChannelRef.current) {
        supabase.removeChannel(streamChannelRef.current)
      }
    }
  }, [platform, stream, supabase])

  function sendShout() {
    if (streamChannelRef.current) {
      streamChannelRef.current.send({
        type: 'broadcast',
        event: 'shout',
        payload: {}
      })
    }
  }

  function sendCry() {
    if (streamChannelRef.current) {
      streamChannelRef.current.send({
        type: 'broadcast',
        event: 'cry',
        payload: {}
      })
    }
  }

  return (
    <main className='m-4'>
      <Card className='p-2'>
        <CardHeader className='flex flex-row justify-between items-center'>
          <h3>
            {platform} / {stream}
          </h3>
          <div className='grid grid-cols-2 gap-2'>
            <Button>
              <SquarePlus />
            </Button>
            <Button>
              <MessageCircleCode />
            </Button>
          </div>
        </CardHeader>
        <CardContent className='bg-slate-100'>
          <div>
            <Button onClick={sendShout}>
              Send shout
            </Button>
            <Button onClick={sendCry}>
              Send cry
            </Button>
          </div>
          <div id='messages'>

          </div>
        </CardContent>
      </Card>
    </main>
  )
}
