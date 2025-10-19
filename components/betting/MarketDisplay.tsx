import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { getTimeRemaining } from '@/lib/timezoneUtils'
import { Market } from '@/lib/types'
import React, { useEffect, useState } from 'react'
import BetFormModal from './BetFormModal'
import { useBetting } from '@/providers/BettingProvider'
import { Badge } from '../ui/badge'

// Timer component for individual market countdown
function MarketTimer({ 
  market,
  onExpire,
}: { 
  market: Market,
  onExpire: () => void
}) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(market.estEndTime))

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(market.estEndTime))
    }, 1000) // Update every second

    return () => clearInterval(interval)
  }, [market.estEndTime])

  // Handle market expiration in useEffect to avoid setState during render
  useEffect(() => {
    if (timeRemaining.isExpired) {
      onExpire()
    }
  }, [timeRemaining.isExpired, onExpire])

  if (timeRemaining.isExpired) {
    return <span className="text-red-500 font-semibold">Expired</span>
  }

  const formatTime = (value: number) => value.toString().padStart(2, '0')

  return (
    <Badge className="text-sm text-muted-foreground">
      <span className="font-mono">
        {timeRemaining.days > 0 && `${timeRemaining.days}d `}
        {formatTime(timeRemaining.minutes)}:
        {formatTime(timeRemaining.seconds)}
      </span>
    </Badge>
  )
}

export default function MarketDisplay() {
  const { markets, removeMarket } = useBetting()
  const [modalStates, setModalStates] = useState<Record<string, { answerA: boolean, answerB: boolean }>>({})

  const getModalState = (marketId: string, isAnswerA: boolean) => {
    return modalStates[marketId]?.[isAnswerA ? 'answerA' : 'answerB'] || false
  }

  const setModalState = (marketId: string, isAnswerA: boolean, isOpen: boolean) => {
    setModalStates(prev => ({
      ...prev,
      [marketId]: {
        ...prev[marketId],
        [isAnswerA ? 'answerA' : 'answerB']: isOpen
      }
    }))
  }

  return (
    <div className='p-4'>
      {Array.from(markets.values()).map((market) => {
        const totalAmount = (market.amountA || 0) + (market.amountB || 0)
        const progress = totalAmount > 0 ? ((market.amountA || 0) / totalAmount) * 100 : 0

        return (
          <Card key={market.id} className="bg-brand-black mb-4">
            <CardHeader>
              <CardTitle className='flex justify-between items-center gap-2'>
                {market.question}
                <MarketTimer
                  market={market}
                  onExpire={() => removeMarket(market.id)}
                />
              </CardTitle>
              <CardDescription>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex flex-col gap-2 justify-center items-center'>
                {totalAmount > 0
                  ? (

                    <Progress 
                    className="w-full bg-brand-cyan"
                    value={progress}
                    />
                  )
                  : (
                    <></>
                  ) 
                } 
                <div className='flex items-center justify-center gap-3 w-full'>
                  <BetFormModal 
                    isModalOpen={getModalState(market.id, true)}
                    setIsModalOpen={(isOpen) => setModalState(market.id, true, isOpen)}
                    marketId={market.id}
                    isAnswerA={true}
                    teamName={market.answerA}
                  />
                  <BetFormModal
                    isModalOpen={getModalState(market.id, false)}
                    setIsModalOpen={(isOpen) => setModalState(market.id, false, isOpen)}
                    marketId={market.id}
                    isAnswerA={false}
                    teamName={market.answerB}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
