"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
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
      <main className='p-4'>
        <div className='mb-6'>
          <Button asChild variant="outline">
            <Link href="/streams">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Streams
            </Link>
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Stream not found.</p>
        </div>
      </main>
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
    <main className='p-4'>
      <div className='mb-6'>
        <Button asChild variant="outline">
          <Link href="/streams">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Streams
          </Link>
        </Button>
      </div>
      
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Stream Video */}
        <div className='lg:col-span-2'>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {stream.platform} / {stream.name}
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

        {
          markets.size === 0
          ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    No markets
                  </CardTitle>
                </CardHeader>
              </Card>
            )
          : (<MarketDisplay />)
        }
      </div>
    </main>
  )
}
