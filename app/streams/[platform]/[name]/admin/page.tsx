"use client"

import Loading from '@/components/Loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { CloudLightning, Zap } from 'lucide-react'

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
      console.log("TREATING MARKET", market)
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
    <main className='m-4'>
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
          {Array.from(markets.values()).map((market) => {
            return (
              <Card key={market.id}>
                <CardHeader>
                  <CardTitle>
                    <div className='flex flex-row gap-2 items-center'>
                      {market.question}
                      <MarketEditModal market={market} stream={stream} />
                    </div>
                  </CardTitle>
                  <CardDescription>
                    <div className='flex flex-row gap-2 items-center'>
                      {market.answerA} <Zap className='h-4 w-4' /> {market.answerB}
                    </div>
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </CardContent>
      </Card>
    </main>
  )
}
