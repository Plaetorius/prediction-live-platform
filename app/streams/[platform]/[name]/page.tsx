"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircleCode, SquarePlus, ArrowLeft, Eye, Calendar } from 'lucide-react'
import React, { useEffect, useState} from 'react'
import { Badge } from '@/components/ui/badge'
import Loading from '@/components/Loading'
import Link from 'next/link'
import { useStream } from '@/providers/stream-providers'
import { useBetChannel } from '@/hooks/useBetChannel'
import { Market } from '@/lib/types'
import MarketDisplay from './MarketDisplay'
import { isMarketActive } from '@/lib/timezoneUtils'
import { selectOpenMarkets } from '@/lib/markets/selectClient'

type MarketWithProgress = Market & {
  progress?: number;
}

type BetInformation = {
  amountA: number;
  amountB: number;
}

export default function StreamPage() {
  const [loading, setLoading] = useState<boolean>(false)
  const [betInformation, setBetInformation] = useState<BetInformation>({
    amountA: 0,
    amountB: 0
  })
  const [progress, setProgress] = useState<number>(0)
  const [markets, setMarkets] = useState<Market[]>([]) // Fetch when landing on page
  const [openedMarkets, setOpenedMarkets] = useState<MarketWithProgress[]>([])

  const stream = useStream()

  const {
    channelRef,
    send,
    sendBetTeam1,
    sendBetTeam2,
  } = useBetChannel(stream?.platform || '', stream?.name || '', {
    onTeam1: (payload) => {
      setBetInformation({ ...betInformation, amountA: betInformation.amountA + payload.amount })
      console.log("BET TEAM1", payload)
    },
    onTeam2: (payload) => {
      console.log("BET TEAM2", payload)
      setBetInformation({ ...betInformation, amountB: betInformation.amountB + payload.amount })
    },
    onNewMarket: (payload) => {
      console.log("NEW MARKET RECEIVED", payload)
      setMarkets(prev => { 
        console.log("PREVIOUS MARKETS", prev)
        const newMarket: Market = {
          id: payload.id,
          question: payload.question,
          answerA: payload.answerA,
          answerB: payload.answerB,
          startTime: payload.startTime,
          estEndTime: payload.estEndTime || Date.now(),
          realEndTime: payload.realEndTime || Date.now(),
          status: payload.status || 'draft',
          duration: payload.duration,
          streamId: payload.streamId,
          createdAt: new Date(), // Date to match other tables, not used in delay calculation
          updatedAt: new Date(),
        }
        console.log("NEW MARKET CREATED", newMarket)
        const updatedMarkets = [...prev, newMarket]
        console.log("UPDATED MARKETS", updatedMarkets)
        return updatedMarkets
      })
    }
  })

  useEffect(() => {
    // TODO replace array by hashmap
    setProgress((betInformation.amountA / (betInformation.amountA + betInformation.amountB)) * 100)
    console.log("BET INFORMATION", betInformation)
  }, [betInformation])

  useEffect(() => {
    console.log("PROGRESS", progress)
  }, [progress])

  
  useEffect(() => {
    const activeMarkets = markets.filter((market) => isMarketActive(market.startTime, market.estEndTime))
    setOpenedMarkets(prev => {
      return [...prev, ...activeMarkets]
    })
  }, [markets])


  useEffect(() => {
    const fetchOngoingMarkets = async (streamId: string | undefined) => {
      if (!streamId)
        return null
      setLoading(true)
      setOpenedMarkets(await selectOpenMarkets(streamId) || [])
      setLoading(false)
    }
    fetchOngoingMarkets(stream?.id)
  }, [])

  useEffect(() => {
    console.log("OPENED MARKETS", openedMarkets)
  }, [openedMarkets])

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
                <Badge variant="outline" className="capitalize">
                  {stream.platform}
                </Badge>
                {stream.name}
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
          openedMarkets.length === 0
          ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    No markets
                  </CardTitle>
                </CardHeader>
              </Card>
            )
          : (<MarketDisplay markets={openedMarkets} setMarkets={setOpenedMarkets} progress={progress} />)
        }

        {/* Stream Info */}
        <div className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stream Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Created:</span>
                <span>{stream.createdAt.toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="font-medium">Platform:</span>
                <Badge variant="outline" className="capitalize">
                  {stream.platform}
                </Badge>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">About this stream</h3>
                <p className="text-muted-foreground text-sm">
                  This is a {stream.platform} stream by {stream.name}. 
                  Enjoy watching and don&apos;t forget to follow for more content!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stream Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stream ID:</span>
                <span className="font-mono text-sm">{stream.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="text-sm">{stream.updatedAt.toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Card className='p-2'>
        <CardHeader className='flex flex-row justify-between items-center'>
          <h3>
            {stream.platform} / {stream.name}
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
            <Button onClick={() => sendBetTeam1({ amount: 1 })}>
              Send Bet Team 1
            </Button>
            <Button onClick={() => sendBetTeam2({ amount: 1})}>
              Send Bet Team 2
            </Button>
          </div>
          <div id='messages'>

          </div>
        </CardContent>
      </Card>
    </main>
  )
}
