"use client"

import React, { useEffect, useState } from 'react'
import { Stream } from '@/lib/types'
import { createSupabaseClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TicketPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Loading from '@/components/Loading'


export default function Streams() {
  const [loading, setLoading] = useState<boolean>(false)
  const [streams, setStreams] = useState<Stream[]>([])
  const [statuses, setStatuses] = useState<Record<string, { live: boolean; game?: string }>>({})

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
      setLoading(false)

      // Fetch live statuses after we have streams
      fetchStatuses(mapped)
    }
    getStreams()
  }, [])

  async function fetchStatuses(items: Stream[]) {
    const results: Record<string, { live: boolean; game?: string }> = {}

    // Environment for Twitch API
    const twitchClientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID
    const twitchToken = process.env.NEXT_PUBLIC_TWITCH_TOKEN

    // Environment for Kick API
    const kickToken = process.env.NEXT_PUBLIC_KICK_TOKEN

    await Promise.all(items.map(async (s) => {
      if (!s) return
      try {
        if (s.platform.toLowerCase() === 'twitch' && twitchClientId && twitchToken) {
          // Check live status
          const res = await fetch(`https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(s.name)}`, {
            headers: {
              'Client-Id': twitchClientId,
              'Authorization': `Bearer ${twitchToken}`,
            },
            cache: 'no-store',
          })
          if (!res.ok) throw new Error(`Twitch status HTTP ${res.status}`)
          const json = await res.json() as { data: Array<{ type: string; game_id?: string }> }
          const liveEntry = json.data?.[0]
          if (liveEntry && liveEntry.type === 'live') {
            let gameName: string | undefined
            if (liveEntry.game_id) {
              const g = await fetch(`https://api.twitch.tv/helix/games?id=${liveEntry.game_id}`, {
                headers: {
                  'Client-Id': twitchClientId,
                  'Authorization': `Bearer ${twitchToken}`,
                },
                cache: 'no-store',
              })
              if (g.ok) {
                const gJson = await g.json() as { data: Array<{ name: string }> }
                gameName = gJson.data?.[0]?.name
              }
            }
            results[s.id] = { live: true, game: gameName }
          } else {
            results[s.id] = { live: false }
          }
        } else if (s.platform.toLowerCase() === 'kick' && kickToken) {
          // Check Kick.com live status
          try {
            // Get user_id from username
            const userRes = await fetch(`https://api.kick.com/public/v1/channels?slug=${encodeURIComponent(s.name)}`, {
              headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${kickToken}`,
              },
              cache: 'no-store',
            })

            if (!userRes.ok) {
              results[s.id] = { live: false }
              return
            }

            const userData = await userRes.json()
            const userId = userData.data?.[0]?.broadcaster_user_id

            if (!userId) {
              results[s.id] = { live: false }
              return
            }

            // Check livestream status
            const streamRes = await fetch(`https://api.kick.com/public/v1/livestreams?broadcaster_user_id=${userId}`, {
              headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${kickToken}`,
              },
              cache: 'no-store',
            })

            if (!streamRes.ok) {
              results[s.id] = { live: false }
              return
            }

            const streamData = await streamRes.json()
            const livestream = streamData.data?.[0]

            if (livestream) {
              const gameName = livestream.category?.name
              results[s.id] = { live: true, game: gameName }
            } else {
              results[s.id] = { live: false }
            }
          } catch (e) {
            console.error('Kick status fetch error for', s.name, e)
            results[s.id] = { live: false }
          }
        } else {
          // Other platforms not yet implemented -> default offline
          results[s.id] = { live: false }
        }
      } catch (e) {
        console.error('Status fetch error for', s.platform, s.name, e)
        results[s.id] = { live: false }
      }
    }))

    setStatuses(results)
  }

  if (loading)
    return <Loading />

  return (
    <main className='p-4'>
      <div className='flex flex-row gap-4 items-center mb-4'>
        <h2>
          Streams
        </h2>
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
                ) : (
                  <Badge variant='outline'>Checking status...</Badge>
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
