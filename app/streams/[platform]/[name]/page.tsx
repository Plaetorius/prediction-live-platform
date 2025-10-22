"use client"

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, TwitchIcon, Heart, Trophy, X } from 'lucide-react'
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
import { calculateWinnings, formatWinnings, formatProfit } from '@/lib/betting/calculateWinnings'

export default function StreamPage() {
  const [loading, setLoading] = useState<boolean>(false)
  const [showResultAnimation, setShowResultAnimation] = useState<boolean>(false)
  const [showWaitingAnimation, setShowWaitingAnimation] = useState<boolean>(false)
  const { markets, setMarkets, result } = useBetting()
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

  // Trigger animation when result is received
  useEffect(() => {
    if (result) {
      setShowResultAnimation(true)
      setShowWaitingAnimation(false) // Hide waiting animation when result is shown
      // Hide animation after 5 seconds
      const timer = setTimeout(() => {
        setShowResultAnimation(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [result])

  // Show waiting animation immediately if no result
  useEffect(() => {
    if (!result) {
      setShowWaitingAnimation(true)
    }
  }, [result])

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

  // Waiting Animation Component
  const WaitingAnimation = () => {
    if (!showWaitingAnimation) return null;

    return (
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center space-y-3">
          {/* Simple spinning loader */}
          <div className="w-8 h-8 border-2 border-brand-pink/30 border-t-brand-pink rounded-full animate-spin mx-auto" style={{ borderTopColor: 'hsl(var(--brand-pink))' }}></div>
          
          {/* Simple text */}
          <p className="text-brand-pink text-sm">
            Waiting...
          </p>
        </div>
      </div>
    );
  };

  // Animated Result Component
  const AnimatedResult = () => {
    if (!result || !showResultAnimation) return null;

    const isWin = result.correct;
    
    // Fixed winnings calculation
    let winningsInfo = null;
    if (result.winnings === undefined || result.profit === undefined) {
      if (isWin) {
        winningsInfo = {
          winnings: 2.85, // Fixed win amount
          profit: 1.85    // Profit = winnings - bet amount (2.85 - 1.00)
        };
      } else {
        winningsInfo = {
          winnings: 0,     // No winnings if lost
          profit: -1.00    // Loss = -bet amount
        };
      }
    }
    
    const bgColor = isWin ? 'from-green-500/20 to-emerald-600/20' : 'from-red-500/20 to-rose-600/20';
    const borderColor = isWin ? 'border-green-400' : 'border-red-400';
    const textColor = isWin ? 'text-green-400' : 'text-red-400';
    const iconColor = isWin ? 'text-green-400' : 'text-red-400';

    return (
      <div className={`absolute inset-0 bg-gradient-to-br ${bgColor} ${borderColor} border-2 rounded-lg flex flex-col items-center justify-center z-10 animate-in fade-in-0 zoom-in-95 duration-500`}>
        {/* Close button */}
        <button
          onClick={() => setShowResultAnimation(false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors z-20"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="text-center space-y-4">
          {/* Animated Icon with enhanced effects */}
          <div className={`${iconColor} animate-bounce relative`}>
            {isWin ? (
              <Trophy className="h-16 w-16 mx-auto drop-shadow-lg" />
            ) : (
              <X className="h-16 w-16 mx-auto drop-shadow-lg" />
            )}
            {/* Glow effect */}
            <div className={`absolute inset-0 ${isWin ? 'bg-green-400' : 'bg-red-400'} rounded-full blur-lg opacity-30 animate-ping`} />
          </div>
          
          {/* Result Text with staggered animation */}
          <div className="space-y-2">
            <h3 className={`text-2xl font-bold ${textColor} animate-pulse drop-shadow-lg`}>
              {isWin ? 'VICTORY!' : 'DEFEAT!'}
            </h3>
            <p className={`text-lg ${textColor} font-semibold animate-in slide-in-from-bottom-2 duration-700 delay-200`}>
              {isWin ? '+2.85 CHZ' : '-1 CHZ'}
            </p>
            {isWin && (
              <p className={`text-sm ${textColor} animate-in slide-in-from-bottom-2 duration-700 delay-300`}>
                Profit: +1.85 CHZ
              </p>
            )}
            <p className="text-sm text-gray-300 animate-in slide-in-from-bottom-2 duration-700 delay-300">
              Market: {result.marketId.slice(0, 8)}...
            </p>
          </div>

          {/* Enhanced Animated Particles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-2 h-2 ${isWin ? 'bg-green-400' : 'bg-red-400'} rounded-full`}
                style={{
                  left: `${15 + i * 8}%`,
                  top: `${25 + (i % 4) * 15}%`,
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '3s',
                  animation: 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite'
                }}
              />
            ))}
          </div>

          {/* Confetti effect for wins */}
          {isWin && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <div
                  key={`confetti-${i}`}
                  className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                  style={{
                    left: `${10 + i * 7}%`,
                    top: `${20 + (i % 3) * 20}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '2s',
                    animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
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
        <div className='relative flex bg-brand-black-2 justify-center items-center h-[30vh] w-full font-semibold rounded-lg overflow-hidden'>
          {/* Animated Result Overlay */}
          <AnimatedResult />
          
          {/* Waiting Animation Overlay */}
          <WaitingAnimation />
          
          {/* Default Content - only show when there's a result but no animation */}
          {!showResultAnimation && !showWaitingAnimation && result && (
            <div className="text-center">
              <div className="space-y-2">
                <div className={`text-lg font-bold ${result.correct ? 'text-green-400' : 'text-red-400'}`}>
                  {result.correct ? 'WIN' : 'LOSE'}
                </div>
                <div className="text-sm text-gray-300">
                  {result.correct ? '+2.85 CHZ' : '-1 CHZ'}
                </div>
                {result.correct && (
                  <div className="text-xs text-gray-400">
                    Profit: +1.85 CHZ
                  </div>
                )}
              </div>
            </div>
          )}
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
              <div className='w-full justify-center items-center'>
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
