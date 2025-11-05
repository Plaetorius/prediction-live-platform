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
// calculateWinnings is now used in BettingProvider, not here
import { useIsMobile } from '@/hooks/use-mobile'

export default function StreamPage() {
  const [loading, setLoading] = useState<boolean>(false)
  const [showResultAnimation, setShowResultAnimation] = useState<boolean>(false)
  const [showWaitingAnimation, setShowWaitingAnimation] = useState<boolean>(false)
  const { markets, setMarkets, result } = useBetting()
  const stream = useStream()
  const isMobile = useIsMobile()
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
    
    // Use real winnings from smart contract calculation
    const winnings = result.winnings ?? 0
    const profit = result.profit ?? (isWin ? 0 : -result.amount)
    
    const bgGradient = isWin 
      ? 'from-green-500/20 via-emerald-500/10 to-teal-500/20' 
      : 'from-red-500/20 via-rose-500/10 to-pink-500/20';
    const borderColor = isWin ? 'border-green-400/40' : 'border-red-400/40';
    const textColor = isWin ? 'text-green-400' : 'text-red-400';
    const iconColor = isWin ? 'text-emerald-400' : 'text-red-400';
    const glowColor = isWin ? 'bg-emerald-500' : 'bg-red-500';

    return (
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} ${borderColor} border-2 rounded-lg flex flex-col items-center justify-center z-10 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-500`}>
        {/* Subtle animated background glow effects - contained */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute top-1/2 left-1/3 w-40 h-40 ${glowColor} rounded-full blur-3xl opacity-12 animate-pulse-glow`} style={{ transform: 'translateY(-50%)' }} />
          <div className={`absolute bottom-1/2 right-1/3 w-40 h-40 ${glowColor} rounded-full blur-3xl opacity-12 animate-pulse-glow`} style={{ animationDelay: '1.5s', transform: 'translateY(50%)' }} />
        </div>

        {/* Close button */}
        <button
          onClick={() => setShowResultAnimation(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-30 bg-black/20 rounded-full p-1.5 backdrop-blur-sm"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="text-center space-y-4 relative z-20 px-4 py-3">
          {/* Animated Icon with modern effects - contained within bounds */}
          <div className={`${iconColor} relative`} style={{ transform: 'translateY(0px)' }}>
            <div className={`absolute inset-0 ${glowColor} rounded-full blur-xl opacity-20 animate-pulse-glow`} style={{ width: '90%', height: '90%', margin: '5%' }} />
            {isWin ? (
              <Trophy className="h-14 w-14 mx-auto drop-shadow-xl animate-scale-in relative z-10" />
            ) : (
              <X className="h-14 w-14 mx-auto drop-shadow-xl animate-scale-in relative z-10" />
            )}
            {/* Subtle rotating rings - contained */}
            <div className={`absolute inset-0 border ${isWin ? 'border-emerald-400/20' : 'border-red-400/20'} rounded-full animate-spin-slow`} style={{ width: '90%', height: '90%', margin: '5%' }} />
          </div>
          
          {/* Result Text with modern typography */}
          <div className="space-y-1.5">
            <h3 className={`text-2xl font-bold ${textColor} drop-shadow-lg animate-scale-in tracking-tight`} style={{ 
              animationDelay: '0.2s',
              textShadow: `0 2px 8px ${isWin ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}>
              {isWin ? 'VICTORY' : 'DEFEAT'}
            </h3>
            
            <div className="space-y-1">
              <p className={`text-xl ${textColor} font-semibold drop-shadow-md animate-scale-in`} style={{ animationDelay: '0.4s' }}>
                {isWin ? `+${winnings.toFixed(4)} CHZ` : `-${result.amount.toFixed(4)} CHZ`}
              </p>
              
              {isWin && profit > 0 && (
                <div className="animate-scale-in" style={{ animationDelay: '0.6s' }}>
                  <p className={`text-sm ${textColor}/90 font-medium`}>
                    Profit: +{profit.toFixed(4)} CHZ
                  </p>
                </div>
              )}
              
              <p className="text-xs text-gray-400/80 mt-2 animate-scale-in font-mono" style={{ animationDelay: '0.8s' }}>
                {result.marketId.slice(0, 8)}...
              </p>
            </div>
          </div>

          {/* Subtle animated particles - kept within bounds */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => {
              const angle = (i * 360) / 12;
              const distance = 35 + (i % 2) * 10;
              const x = 50 + Math.cos(angle * Math.PI / 180) * distance;
              const y = 50 + Math.sin(angle * Math.PI / 180) * distance;
              
              return (
                <div
                  key={i}
                  className={`absolute w-1.5 h-1.5 ${isWin ? 'bg-emerald-400/60' : 'bg-red-400/60'} rounded-full`}
                  style={{
                    left: `${Math.max(5, Math.min(95, x))}%`,
                    top: `${Math.max(5, Math.min(95, y))}%`,
                    animationDelay: `${i * 0.15}s`,
                    animation: 'float 3s ease-in-out infinite',
                  }}
                />
              );
            })}
          </div>

          {/* Modern confetti effect for wins - subtle and contained */}
          {isWin && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(12)].map((_, i) => {
                const colors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];
                const color = colors[i % colors.length];
                const left = `${15 + (i * 6)}%`;
                const delay = (i * 0.2) % 2;
                
                return (
                  <div
                    key={`confetti-${i}`}
                    className="absolute w-1 h-1 rounded-full"
                    style={{
                      backgroundColor: color,
                      left,
                      top: '0px',
                      animationDelay: `${delay}s`,
                      animation: 'confetti-fall 2.5s linear infinite',
                      opacity: 0.5
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Subtle defeat effect */}
          {!isWin && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <div
                  key={`fragment-${i}`}
                  className="absolute w-1 h-1 bg-red-400/40 rounded-full"
                  style={{
                    left: `${40 + (i % 3) * 10}%`,
                    top: `${40 + Math.floor(i / 3) * 10}%`,
                    animationDelay: `${i * 0.15}s`,
                    animation: 'float 2s ease-in-out infinite',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render mobile layout
  if (isMobile) {
    return (
      <main className='flex h-screen w-full overflow-hidden'>
        {/* Stream Section - Left Side */}
        <section className='bg-brand-black-5 w-2/3 flex flex-col'>
          {/* Stream Status Subheader */}
          <div className='w-full p-2 bg-neutral-900 border-b border-gray-700 flex-shrink-0'>
            <div className="flex items-center gap-1 mb-1">
              <Button asChild className='bg-brand-purple hover:bg-brand-purple-dark h-7 text-xs flex-1'>
                <Link href={streamLink}>
                  <TwitchIcon strokeWidth={2} className="h-3 w-3 mr-1" />
                  {stream.platform}
                </Link>
              </Button>

              <Button
                className='bg-brand-pink hover:bg-brand-pink-dark h-7 w-7 p-0'
                onClick={handleFollow}
                disabled={followingLoading}
              >
                <Heart fill='white' fillOpacity={isFollowing ? 1 : 0} className="h-3 w-3" />
              </Button>

              {status && status.live && status.viewer_count && (
                <div className="flex items-center text-xs text-brand-pink">
                  <Users strokeWidth={2} className="h-3 w-3 mr-1" />
                  <span className="font-medium text-xs">{formatViewerCount(status.viewer_count)}</span>
                </div>
              )}
            </div>
            
            {status && status.live && status.title && (
              <div className="text-xs text-gray-300 truncate">
                <span className="text-white">{status.title}</span>
              </div>
            )}
            
            {statusError && (
              <Badge variant="destructive" className="w-full justify-center mt-1 text-xs">
                Error: {statusError}
              </Badge>
            )}
          </div>
          
          {/* Stream Video */}
          <div className="flex-1 w-full overflow-hidden">
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

        {/* Betting Section - Right Side */}
        <section className='flex flex-col bg-brand-black w-1/3 border-l border-gray-800 overflow-hidden'>
          {/* Status Card */}
          <div className='relative flex bg-brand-black-2 justify-center items-center h-12 w-full font-semibold overflow-hidden border-b border-gray-800 flex-shrink-0'>
            {/* Animated Result Overlay */}
            <AnimatedResult />
            
            {/* Waiting Animation Overlay */}
            <WaitingAnimation />
            
            {/* Default Content */}
            {!showResultAnimation && !showWaitingAnimation && result && (
              <div className="text-center">
                <div className={`text-[10px] font-bold ${result.correct ? 'text-green-400' : 'text-red-400'}`}>
                  {result.correct ? 'WIN' : 'LOSE'}
                </div>
              </div>
            )}
          </div>
          
          {/* Markets */}
          <div className='bg-brand-black-2 flex-1 overflow-y-auto no-scrollbar'>
            {
              markets.size === 0
              ? (
                <div className='flex justify-center items-center h-full p-4'>
                  <p className='text-gray-400 text-xs text-center'>No markets</p>
                </div>
              )
              : (
                <MarketDisplay />
              )
            }
          </div>
        </section>
      </main>
    )
  }

  // Render desktop layout
  return (
    <main className='grid grid-cols-4 h-screen'>
      <section className='col-span-3 bg-brand-black-5 w-full h-screen overflow-y-auto'>
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
      <section className='col-span-1 flex flex-col gap-2 bg-brand-black w-full p-2 overflow-y-auto'>
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
                  {result.correct ? `+${(result.winnings ?? 0).toFixed(4)} CHZ` : `-${result.amount.toFixed(4)} CHZ`}
                </div>
                {result.correct && (result.profit ?? 0) > 0 && (
                  <div className="text-xs text-gray-400">
                    Profit: +{(result.profit ?? 0).toFixed(4)} CHZ
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
