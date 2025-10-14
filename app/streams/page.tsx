"use client"

import React, { useEffect, useState } from 'react'
import { Stream } from '@/lib/types'
import { createSupabaseClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TicketPlus, Play, Users, Eye, TrendingUp, Clock } from 'lucide-react'
import { toast } from 'sonner'
import Loading from '@/components/Loading'
import GlassSurface from '@/components/GlassSurface'
import GradientBlinds from '@/components/GradientBlinds'


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
    <div className="min-h-screen relative">
      {/* GradientBlinds Background */}
      <div className="absolute inset-0 w-full h-full">
          <GradientBlinds
            gradientColors={['#FB2B37', '#2a0a0a']}
            angle={35}
            noise={0.1}
            blindCount={30}
            blindMinWidth={80}
            spotlightRadius={0}
            spotlightSoftness={0}
            spotlightOpacity={0}
            mouseDampening={0}
            distortAmount={1}
            shineDirection="left"
            mixBlendMode="normal"
          />
      </div>
      
      {/* Main content */}
      <div className="relative z-10 min-h-screen p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-wider uppercase">
              STREAMS
            </h1>
            <p className="text-white/70 text-lg tracking-widest uppercase font-light">
              LIVE PREDICTION MARKETS
            </p>
          </div>
          
              <GlassSurface 
                width={200} 
                height={60}
                borderRadius={16}
                backgroundOpacity={0.6}
                className="hover:scale-105 transition-transform duration-200"
              >
            <Button asChild className="w-full h-full bg-transparent hover:bg-white/10 text-white border-0">
              <Link href="/streams/create" className="flex items-center gap-2 text-base font-medium tracking-wider uppercase">
                <TicketPlus className="h-5 w-5" />
                ADD STREAM
              </Link>
            </Button>
          </GlassSurface>
        </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto justify-items-center">
              <GlassSurface 
                width={300} 
                height={120}
                borderRadius={20}
                backgroundOpacity={0.5}
                className="hover:scale-105 transition-transform duration-200"
              >
            <div className="flex items-center gap-4 p-6">
              <div className="p-3 bg-red-500/20 rounded-full">
                <Play className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-white/70 text-sm font-medium tracking-wider uppercase">TOTAL STREAMS</p>
                <p className="text-3xl font-bold text-white">{streams.length}</p>
              </div>
            </div>
          </GlassSurface>
          
              <GlassSurface 
                width={300} 
                height={120}
                borderRadius={20}
                backgroundOpacity={0.5}
                className="hover:scale-105 transition-transform duration-200"
              >
                <div className="flex items-center gap-4 p-6">
                  <div className="p-3 bg-red-500/20 rounded-full">
                    <Eye className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-white/70 text-sm font-medium tracking-wider uppercase">LIVE NOW</p>
                    <p className="text-3xl font-bold text-white">
                      {Object.values(statuses).filter(s => s?.live).length}
                    </p>
                  </div>
                </div>
              </GlassSurface>
          
          <GlassSurface 
            width={300} 
            height={120}
            borderRadius={20}
            backgroundOpacity={0.5}
            className="hover:scale-105 transition-transform duration-200"
          >
            <div className="flex items-center gap-4 p-6">
              <div className="p-3 bg-red-500/20 rounded-full">
                <TrendingUp className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-white/70 text-sm font-medium tracking-wider uppercase">ACTIVE MARKETS</p>
                <p className="text-3xl font-bold text-white">-</p>
              </div>
            </div>
          </GlassSurface>
        </div>

            {/* Streams Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto justify-items-center">
          {streams.map((stream) => {
            if (!stream) return null
            const st = statuses[stream.id]
            const isLive = st?.live
            const game = st?.game
            
            return (
              <Link key={stream.id} href={`/streams/${stream.platform}/${stream.name}`}>
                <GlassSurface 
                  width={320} 
                  height={280}
                  borderRadius={20}
                  backgroundOpacity={isLive ? 0.7 : 0.6}
                  className="hover:scale-105 transition-all duration-300 group cursor-pointer"
                >
                  <div className="p-6 h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          stream.platform.toLowerCase() === 'twitch' 
                            ? 'bg-purple-500' 
                            : 'bg-purple-500'
                        }`}></div>
                        <span className="text-xs font-medium text-white/70 tracking-wider uppercase">
                          {stream.platform}
                        </span>
                      </div>
                      
                      {isLive && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white text-xs font-bold rounded-full shadow-lg shadow-red-500/40 ml-4">
                          <div className="w-2 h-2 bg-red-100 rounded-full animate-pulse"></div>
                          LIVE
                        </div>
                      )}
                    </div>

                    {/* Stream Info */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-300 transition-colors">
                          {stream.name}
                        </h3>
                        
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                          <span className="text-white/80 text-sm font-medium">
                            {game || 'Streamer'}
                          </span>
                        </div>
                      </div>

                      {/* Status & Viewers */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          {st ? (
                            isLive ? (
                              <div className="px-3 py-1 bg-red-500/20 text-red-300 text-xs font-semibold rounded-full border border-red-500/40">
                                {game || 'LIVE'}
                              </div>
                            ) : (
                              <div className="px-3 py-1 bg-white/10 text-white/60 text-xs font-medium rounded-full border border-white/20">
                                <Clock className="w-3 h-3 mr-1 inline" />
                                OFFLINE
                              </div>
                            )
                          ) : (
                            <div className="px-3 py-1 bg-white/10 text-white/60 text-xs font-medium rounded-full border border-white/20">
                              <div className="w-2 h-2 bg-white/60 rounded-full mr-2 animate-spin inline-block"></div>
                              CHECKING...
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-white/60">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">
                            {isLive ? Math.floor(Math.random() * 1000) + 100 : 0} viewers
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                </GlassSurface>
              </Link>
            )
          })}
        </div>

        {/* Empty state */}
        {streams.length === 0 && !loading && (
          <div className="text-center py-20">
                <GlassSurface 
                  width={400} 
                  height={300}
                  borderRadius={24}
                  backgroundOpacity={0.5}
                >
              <div className="p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6">
                  <Play className="h-8 w-8 text-white/60" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 tracking-wider uppercase">NO STREAMS YET</h3>
                <p className="text-white/60 mb-8 tracking-wide">Be the first to add a stream and start betting!</p>
                <Button asChild className="bg-red-500 hover:bg-red-600 text-white tracking-wider uppercase">
                  <Link href="/streams/create">
                    <TicketPlus className="h-5 w-5 mr-2" />
                    ADD YOUR FIRST STREAM
                  </Link>
                </Button>
              </div>
            </GlassSurface>
          </div>
        )}
      </div>
    </div>
  )
}
