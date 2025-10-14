"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import React, { useEffect, useState} from 'react'
import Loading from '@/components/Loading'
import Link from 'next/link'
import { useStream } from '@/providers/StreamProvider'
import { MarketWithAmounts } from '@/lib/types'
import MarketDisplay from '../../../../components/betting/MarketDisplay'
import { selectOpenMarkets } from '@/lib/markets/selectClient'
import { useBetting } from '@/providers/BettingProvider'
import { getEmbedUrl } from '@/lib/utils'

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
      const marketsMap = new Map<string, MarketWithAmounts>()
      marketsArray.forEach(market => {
        marketsMap.set(market.id, market)
      })
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
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back home
            </Link>
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Stream not found.</p>
        </div>
      </main>
    )

  if (loading)
    return <Loading />

  return (
    <main className='p-4'>      
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
