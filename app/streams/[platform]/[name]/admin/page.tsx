"use client"

import Loading from '@/components/Loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BetChannelOptions, Market, Stream } from '@/lib/types'
import { useStream } from '@/providers/StreamProvider'
import React, { useEffect, useState, useCallback } from 'react'
import { useBetChannel } from '@/hooks/useBetChannel'
import MarketFormModal from '@/components/betting/MarketCreationModal'
import { useBetting } from '@/providers/BettingProvider'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Database } from '@/database.types'
import { toast } from 'sonner'
import MarketEditModal from '@/components/betting/MarketEditModal'
import { CloudLightning, Zap, ArrowLeft, Plus, Settings, TrendingUp, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { getTimeRemaining, now } from '@/lib/timezoneUtils'
import MarketResolutionModal from './MarketResolutionModal'
import Link from 'next/link'

// Timer component for individual market countdown
function MarketTimer({ 
  market,
}: { 
  market: Market
}) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(market.estEndTime))

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(market.estEndTime))
    }, 1000) // Update every second

    return () => clearInterval(interval)
  }, [market.estEndTime])

  if (timeRemaining.isExpired) {
    return <span className="text-red-500 font-semibold">Expired</span>
  }

  const formatTime = (value: number) => value.toString().padStart(2, '0')

  return (
    <div className="text-sm text-muted-foreground font-mono">
      <span className="font-semibold">
        {timeRemaining.days > 0 && `${timeRemaining.days}d `}
        {formatTime(timeRemaining.hours)}:
        {formatTime(timeRemaining.minutes)}:
        {formatTime(timeRemaining.seconds)}
      </span>
    </div>
  )
}

// Function to get status-based background color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-600 border-l-gray-400'
    case 'open':
      return 'bg-green-100 text-green-600 border-l-green-400'
    case 'timeout':
      return 'bg-blue-100 text-blue-600 border-l-blue-400'
    case 'stopped':
      return 'bg-orange-100 text-orange-600 border-l-orange-400'
    case 'error':
      return 'bg-red-100 text-red-600 border-l-red-400'
    case 'voided':
      return 'bg-gray-100 text-gray-600 border-l-gray-400'
    default:
      return 'bg-gray-100 text-gray-600 border-l-gray-400'
  }
}

const fetchAndSetMarkets = async (
  stream: Stream, 
  setMarkets: (markets: Map<string, Market>) => void,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  try {
    console.log("STREAM ID", stream?.id || "No stream ID")
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('markets')
      .select()
      .eq('stream_id', stream?.id)
      .order('created_at', { ascending: false })

    const newMap = new Map<string, Market>()
    data?.forEach((market) => {
      const formattedMarket: Market = {
        id: market.id || '',
        question: market.question as string,
        answerA: market.answer_a as string,
        answerB: market.answer_b as string,
        startTime: market.start_time as number,
        estEndTime: market.est_end_time as number,
        realEndTime: market.real_end_time as number,
        status: market.status as Database["public"]["Enums"]["market_status"],
        duration: market.duration as number,
        streamId: market.stream_id as string,
        isAnswerA: market.is_answer_a as boolean | null,
        createdAt: new Date(market.created_at),
        updatedAt: new Date(market.updated_at)
      }
      newMap.set(formattedMarket.id, formattedMarket)
    }) 
    setMarkets(newMap)
  } catch (error) {
    console.error("Error retrieving markets from database:", error)
    toast.error("Error retrieving markets from database.")
    return
  } finally {
    setLoading(false)
  }
}

export default function StreamAdmin() {
  const stream = useStream()
  // const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const { markets, setMarkets } = useBetting()
  const [loading, setLoading] = useState<boolean>(false)

  const realtimeOptions: BetChannelOptions = {
    broadcastSelf: true,
    kind: 'all' 
  }

  const {
    sendNewMarket
  } = useBetChannel(
    stream?.platform || '', 
    stream?.name || '', 
    undefined, 
    realtimeOptions
  )

  useEffect(() => {
    fetchAndSetMarkets(stream, setMarkets, setLoading)
  }, [stream?.id, setMarkets])

  if (!stream || loading)
    return <Loading />
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            {stream.platform} / {stream.name}&apos;s admin page
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MarketFormModal 
            stream={stream}
            sendNewMarket={sendNewMarket}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          Markets on {stream.platform} / {stream.name}
        </CardHeader>
        <CardContent className='grid grid-cols-2 gap-2'>
          {Array.from(markets.values())
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map((market) => {
            return (
              <Card key={market.id} className={`${getStatusColor(market.status)} border-l-4 border-l-gray-400`}>
                <CardHeader>
                  <CardTitle>
                    <div className='flex flex-row gap-2 items-center'>
                      {market.question}
                      <MarketEditModal market={market} stream={stream} />
                      <MarketResolutionModal market={market} />
                    </div>
                  </CardTitle>
                  <CardDescription>
                    <div className='flex flex-col gap-2'>
                      <div className='flex flex-row gap-2 items-center'>
                        {market.answerA} <Zap className='h-4 w-4' /> {market.answerB}
                      </div>
                      <div className='flex flex-row justify-between items-center'>
                        <MarketTimer market={market} />
                        <span className='text-xs font-medium px-2 py-1 rounded-full bg-white/50'>
                          {market.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </CardContent>
      </Card>
    </>
  )
}