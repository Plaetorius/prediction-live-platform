"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Play, TrendingUp } from 'lucide-react'
import React, { useEffect, useState} from 'react'
import Loading from '@/components/Loading'
import Link from 'next/link'
import { useStream } from '@/providers/StreamProvider'
import { MarketWithAmounts } from '@/lib/types'
import MarketDisplay from '@/components/betting/MarketDisplay'
import { selectOpenMarkets } from '@/lib/markets/selectClient'
import { useBetting } from '@/providers/BettingProvider'
import { selectBetsWithMarketId } from '@/lib/bets/selectClient'

export default function StreamPage() {
  const [loading, setLoading] = useState<boolean>(false)
  const { markets, setMarkets } = useBetting()
  const stream = useStream()

  useEffect(() => {
    const fetchOngoingMarkets = async (streamId: string | undefined) => {
      if (!streamId)
        return null
      setLoading(true)
      const marketsArray = await selectOpenMarkets(streamId) || []
      
      const marketsWithBets = await Promise.all(
        marketsArray.map(async (market) => {
          const bets = await selectBetsWithMarketId({ marketId: market.id, status: 'confirmed' })
          let { amountA, amountB } = { amountA: 0, amountB: 0 }
          bets?.forEach((bet) => {
            console.log("BET", bet)
            if (bet.isAnswerA) {
              amountA += bet.amount
            } else {
              amountB += bet.amount
            }
            // bet.isAnswerA ? amountA += bet.amount : amountB += bet.amount
          })
          return { ...market, amountA, amountB }
        })
      )
      
      const marketsMap = new Map<string, MarketWithAmounts>()
      marketsWithBets.forEach(market => {
        marketsMap.set(market.id, market)
      })

      console.log("MARKETS MAP", marketsMap)

      setMarkets(marketsMap)
      setLoading(false)
    }
    fetchOngoingMarkets(stream?.id)
  }, [setMarkets])

  if (!stream)
    return (
      <div className="min-h-screen p-4">
        <div className="mb-6">
          <Button asChild variant="ghost">
            <Link href="/streams" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Streams
            </Link>
          </Button>
        </div>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Stream not found</h2>
          <p className="text-muted-foreground mb-8">The stream you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Button asChild>
            <Link href="/streams">
              Browse All Streams
            </Link>
          </Button>
        </div>
      </div>
    )

  const getEmbedUrl = (platform: string, streamName: string) => {
    // Get hostname safely (only in browser)
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
    
    switch (platform.toLowerCase()) {
      case 'twitch':
        return `https://player.twitch.tv/?channel=${streamName}&parent=${hostname}`
      case 'youtube':
        return `https://www.youtube.com/embed/${streamName}`
      case 'kick':
        return `https://player.kick.com/${streamName}`
      default:
        return `https://player.twitch.tv/?channel=${streamName}&parent=${hostname}`
    }
  }

  if (loading)
    return <Loading />

  return (
    <div className="min-h-screen p-4">
      <div className="mb-6">
        <Button asChild variant="ghost">
          <Link href="/streams" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Streams
          </Link>
        </Button>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Badge 
              variant="secondary" 
              className={`text-sm ${
                stream.platform.toLowerCase() === 'twitch' 
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : 'bg-green-500/20 text-green-300 border-green-500/30'
              }`}
            >
              {stream.platform.toUpperCase()}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold">{stream.name}</h1>
          </div>
          <p className="text-muted-foreground text-lg">Live stream with prediction markets</p>
        </div>
        
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stream Video */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-red-500" />
                Live Stream
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                <iframe
                  src={getEmbedUrl(stream.platform, stream.name)}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allowFullScreen
                  className="w-full h-full"
                  title={`${stream.platform} stream - ${stream.name}`}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Markets Section */}
        <div className="space-y-6">
          {markets.size === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-4">No Active Markets</h3>
                <p className="text-muted-foreground">
                  There are currently no prediction markets for this stream.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-red-500" />
                  Active Markets
                  <Badge variant="secondary" className="ml-auto">
                    {markets.size} market{markets.size > 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MarketDisplay />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}