"use client"

import Loading from '@/components/Loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/supabase/client'
import { BetListeners, BetChannelOptions, Stream } from '@/lib/types'
import { useStream } from '@/providers/stream-providers'
import React, { useEffect, useState } from 'react'
import { useBetChannel } from '@/hooks/useBetChannel'
import { Button } from '@/components/ui/button'

export default function StreamAdmin() {
  const [loading, setLoading] = useState<boolean>(false)
  const stream = useStream()
  const [logs, setLogs] = useState<any[]>([])

  const betListeners: BetListeners = {
    onTeam1: (payload: any) => { 
      console.log("onTeam1", payload)
      setLogs(prevLogs => [...prevLogs, payload])
    },
    onTeam2: (payload: any) => {
      console.log("onTeam2", payload)
      setLogs(prevLogs => [...prevLogs, payload])
    },
  }

  const realtimeOptions: BetChannelOptions = {
    broadcastSelf: true,
    kind: 'all' 
  }

  // Always call hooks at the top level, before any early returns
  const { 
    channelRef,
    send,
    sendBetTeam1,
    sendBetTeam2
  } = useBetChannel(
    stream?.platform || '', 
    stream?.name || '', 
    betListeners, 
    realtimeOptions
  )

  // Early return after all hooks have been called
  if (!stream)
    return <Loading />

  channelRef.current?.subscribe()
  
  return (
    <main className='m-4'>
      <Card>
        <CardHeader>
          <CardTitle>
            {stream.platform} / {stream.name}&apos;s admin page
          </CardTitle>
          <CardDescription>

          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-4 gap-3'>
            <Button onClick={() => sendBetTeam1({ 'bet': 'team1' })}>
              Send bet team 1
            </Button>
            <Button onClick={() => sendBetTeam2({ 'bet': 'team2' } )}>
              Send bet team 2
            </Button>
          </div>
          <div className='mt-4 '>
            <h4>
              Logs
            </h4>
            <div className='p-4 rounded-l bg-gray-100'>
              {logs.map((log, index) => {
                return (
                  <div key={index}>
                    {JSON.stringify(log)}
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
