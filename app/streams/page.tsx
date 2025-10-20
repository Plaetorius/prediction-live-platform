"use client"

import React, { useEffect, useState } from 'react'
import { Stream } from '@/lib/types'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useBatchPlatformStatus } from '@/hooks/usePlatformStatus'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TicketPlus, Play, Users, Eye, TrendingUp, Clock } from 'lucide-react'
import { toast } from 'sonner'
import Loading from '@/components/Loading'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'


export default function Streams() {
  const [loading, setLoading] = useState<boolean>(true) // Start with true to prevent flash
  const [streams, setStreams] = useState<Stream[]>([])
  const [streamsLoaded, setStreamsLoaded] = useState<boolean>(false)

  // Use the hook to automatically fetch and refresh statuses
  const { statuses, loading: statusLoading, error: statusError } = useBatchPlatformStatus(
    streams.filter(stream => stream !== null).map(stream => ({
      id: stream.id,
      platform: stream.platform,
      name: stream.name
    })),
    { 
      refreshInterval: 30000, // Refresh every 30 seconds
      enabled: streamsLoaded && streams.length > 0 
    }
  )

  useEffect(() => {
    async function getStreams() {
      const supabase = createSupabaseClient()

      setLoading(true)
      const { data, error } = await supabase
        .from('streams')
        .select()
        .range(0, 5)

        if (error) {
        setLoading(false)
        toast.error("Error retrieving streams")
        console.error(error)
        return 
      }
      console.log("Retrieved data", data)
      const mapped = data.map((stream) => { 
        if (!stream) return null
        return {
          ...stream,
          createdAt: new Date(stream.created_at),
          updatedAt: new Date(stream.updated_at)
        }
      }).filter((stream): stream is Stream => stream !== null)
      setStreams(mapped)
      setStreamsLoaded(true)
      setLoading(false)
    }
    getStreams()
  }, [])


  if (loading)
    return <Loading />

  return (
    <main className='p-4'>
      <div className='flex flex-row gap-4 items-center mb-4'>
        <h2>
          Streams
        </h2>
        {statusLoading && (
          <Badge variant="outline" className="animate-pulse text-xs">
            Refreshing...
          </Badge>
        )}
        <Button asChild variant="default" className='size-8'>
          <Link href="/streams/create">
            <TicketPlus />
          </Link>
        </Button>
      </div>
      <div className='grid grid-cols-4 gap-4'>
        {streams.map((stream) => {
          if (!stream) return null
          const st = statuses[stream.id]
          return (
            <Card key={stream.id}>
              <CardHeader>
                <CardTitle>
                  {stream.platform} / {stream.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {st ? (
                  st.live ? (
                    <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">
                      {st.game || 'Live'}
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/15 text-red-500 border-red-500/30">
                      Offline
                    </Badge>
                  )
                ) : statusLoading ? (
                  <Badge variant='outline' className="animate-pulse">Checking status...</Badge>
                ) : (
                  <Badge variant='outline'>Loading...</Badge>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild>
                  <Link href={`/streams/${stream.platform}/${stream.name}`}>
                    Watch
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </main>
  )
}
