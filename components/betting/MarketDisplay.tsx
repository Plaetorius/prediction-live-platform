import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { getTimeRemaining } from '@/lib/timezoneUtils'
import { Market } from '@/lib/types'
import React, { useEffect, useState } from 'react'
import BetFormModal from './BetFormModal'
import { useBetting } from '@/providers/BettingProvider'

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
    <div className="text-sm text-muted-foreground">
      <span className="font-mono">
        {timeRemaining.days > 0 && `${timeRemaining.days}d `}
        {formatTime(timeRemaining.hours)}:
        {formatTime(timeRemaining.minutes)}:
        {formatTime(timeRemaining.seconds)}
      </span>
    </div>
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
    <Card>
      <CardHeader>
        <CardTitle>
          Predictions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {Array.from(markets.values())
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((market) => {
          const totalAmount = (market.amountA || 0) + (market.amountB || 0)
          const progress = totalAmount > 0 ? ((market.amountA || 0) / totalAmount) * 100 : 0

          return (
            <Card key={market.id} className="mb-4">
              <CardHeader>
                <CardTitle>
                  {market.question}
                </CardTitle>
                <CardDescription>
                  <MarketTimer
                    market={market}
                    onExpire={() => removeMarket(market.id)}
                  />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='flex flex-row gap-2 justify-center items-center'>
                  <BetFormModal 
                    isModalOpen={getModalState(market.id, true)}
                    setIsModalOpen={(isOpen) => setModalState(market.id, true, isOpen)}
                    marketId={market.id}
                    isAnswerA={true}
                    teamName={market.answerA}
                  />
                  <Progress 
                    className='w-[60%]'
                    value={progress}
                  />
                  <BetFormModal
                    isModalOpen={getModalState(market.id, false)}
                    setIsModalOpen={(isOpen) => setModalState(market.id, false, isOpen)}
                    marketId={market.id}
                    isAnswerA={false}
                    teamName={market.answerB}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </CardContent>
    </Card>
  )
}
