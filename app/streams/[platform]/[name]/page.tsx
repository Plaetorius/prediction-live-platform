"use client"

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, TwitchIcon, Heart } from 'lucide-react'
import React, { useEffect, useState} from 'react'
import Loading from '@/components/Loading'
import Link from 'next/link'
import { useStream } from '@/providers/StreamProvider'
import { MarketWithAmounts } from '@/lib/types'
import MarketDisplay from '@/components/betting/MarketDisplay'
import { selectOpenMarkets } from '@/lib/markets/selectClient'
import { useBetting } from '@/providers/BettingProvider'
import { getEmbedUrl } from '@/lib/utils'
import { usePlatformStatus } from '@/hooks/usePlatformStatus'
import { useStreamFollows } from '@/providers/StreamFollowsProvider'
import { toast } from 'sonner'
import { useResult } from '@/providers/ResultProvider'

export default function StreamPage() {
  const [loading, setLoading] = useState<boolean>(false)
  const { markets, setMarkets } = useBetting()
  const stream = useStream()
  const streamLink = stream?.platform && stream?.name 
    ? `https://${stream.platform}${stream.platform === "twitch" ? ".tv" : ".com"}/${stream.name}`
    : ""

  // Get platform status with 30-second refresh
  const { status, loading: statusLoading, error: statusError, refetch } = usePlatformStatus(
    stream?.platform || '',
    stream?.name || '',
    { 
      refreshInterval: 30000, // Refresh every 30 seconds
      enabled: !!stream?.platform && !!stream?.name 
    }
  )

  const { follows, addFollowing, removeFollowing, loading: followingLoading, error: followingError} = useStreamFollows()
  const isFollowing = follows.find((streamId) => streamId === stream?.id) ? true : false
  const { result } = useResult()

  useEffect(() => {
    const fetchOngoingMarkets = async (streamId: string | undefined) => {
      if (!streamId)
        return null
      setLoading(true)
      const marketsArray = await selectOpenMarkets(streamId) || []
      const marketsMap = new Map<string, MarketWithAmounts>()
      marketsArray.forEach(market => {
        marketsMap.set(market.id, {
          ...market,
          amountA: 0,
          amountB: 0,
        })
      })

      setMarkets(marketsMap)
      setLoading(false)
    }
    fetchOngoingMarkets(stream?.id)
  }, [setMarkets, stream?.id])

  const handleFollow = async () => {
    if (!stream)
      return
    if (isFollowing) {
      await removeFollowing(stream.id)
    } else {
      await addFollowing(stream.id)
    }
    if (followingError) {
      toast.error(followingError)
    }
  }

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
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Stream not found</h2>
          <p className="text-muted-foreground mb-8">The stream you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Button asChild>
            <Link href="/streams">
              Browse All Streams
            </Link>
          </Button>
        </div>
      </main>
    )

  if (loading)
    return <Loading />

  // Helper function for formatting viewer count with locale separators (e.g., 1,234)
  const formatViewerCount = (count: number | null) => {
    if (count === null || count === undefined) return 'N/A';
    return count.toLocaleString();
  };

  const formatStartTime = (startedAt: string | null) => {
    if (!startedAt) return 'N/A';
    const startTime = new Date(startedAt);
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m ago`;
    }
    return `${diffMinutes}m ago`;
  };

  return (
    <main className='grid grid-cols-4'>
      <section className='col-span-3 bg-brand-black-5 w-full h-screen'>
        {/* Stream Status Subheader */}
        <div className='w-full p-4 bg-neutral-900 border-b border-gray-700'>
          {/* Top row */}
          <div className="flex items-center justify-between gap-2">
            <div className='flex flex-items-center justify-start gap-2'>
              <Button asChild className='bg-brand-purple hover:bg-brand-purple-dark h-8'>
                <Link href={streamLink}>
                  <TwitchIcon strokeWidth={2.5} />
                  {stream.platform} / {stream.name}
                </Link>
              </Button>

              <Button
                className='bg-brand-pink hover:bg-brand-pink-dark h-8 w-8'
                onClick={handleFollow}
                disabled={followingLoading}
              >
                <Heart fill='white' fillOpacity={isFollowing ? 1 : 0} />
              </Button>

              {status && status.live && status.viewer_count && (
                <div className="flex items-center text-sm text-brand-pink">
                  <Users strokeWidth={2.5} className="h-4 w-4 mr-2" />
                  <span className="font-medium">{formatViewerCount(status.viewer_count)}</span>
                </div>
              )}
            </div>
            
            <div className='flex justify-center w-full'>
              {status && status.live && status.title && (
                <div className="text-sm text-gray-300">
                  <span className="text-white">{status.title}</span>
                </div>
              )}
            </div>
          </div>
        
          {statusError && (
            <Badge variant="destructive" className="w-full justify-center">
              Error: {statusError}
            </Badge>
          )}
        
        </div>
        
        {/* Stream Video */}
        <div className="p-4 aspect-video w-full overflow-hidden">
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
      </section>
      <section className='col-span-1 flex flex-col gap-2 bg-brand-black w-full p-2'>
        <div className='flex bg-brand-black-2 justify-center items-center h-[30vh] w-full font-semibold'>
          {
            result
            ? (
              <div>
                You won {result.exitAmount} at {result.id}!
                {result.correct ? "WIN" : "LOSE"}
              </div>
            )
            : (
              <div>
                No result for now
              </div>
            )
          }
        </div>
        <div className='bg-brand-black-2 center h-full w-full font-semibold'>
          {
            markets.size === 0
            ? (
              <div className='flex justify-center items-center h-full'>
                No markets
              </div>
            )
            : (
              <div className='flex justify-center items-center'>
                <MarketDisplay />
              </div>
            )
          }
        </div>
      </section>
    
    </main>
  )

  // return (
  //   <main className='p-4'>      
  //     <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
  //       {/* Stream Video */}
  //       <div className='lg:col-span-2'>
  //         <Card>
  //           <CardHeader>
  //             <CardTitle className="flex items-center gap-2">
  //               {stream.platform} / {stream.name}
  //             </CardTitle>
  //           </CardHeader>
  //           <CardContent>
  //             <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
  //               <iframe
  //                 src={getEmbedUrl(stream.platform, stream.name)}
  //                 width="100%"
  //                 height="100%"
  //                 frameBorder="0"
  //                 allowFullScreen
  //                 className="w-full h-full"
  //                 title={`${stream.platform} stream - ${stream.name}`}
  //               />
  //             </div>
  //           </CardContent>
  //         </Card>
  //       </div>

  //       {
  //         markets.size === 0
  //         ? (
  //             <Card>
  //               <CardHeader>
  //                 <CardTitle>
  //                   No markets
  //                 </CardTitle>
  //               </CardHeader>
  //             </Card>
  //           )
  //         : (<MarketDisplay />)
  //       }
  //     </div>
  //   </main>
  // )
}
