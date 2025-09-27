import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { createBetClient } from '@/lib/bets/insertClient'
import { isMarketActive, getTimeRemaining } from '@/lib/timezoneUtils'
import { Market } from '@/lib/types'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import BetFormModal from './BetFormModal'

// Timer component for individual market countdown
function MarketTimer({ market, setMarkets }: { market: Market, setMarkets: React.Dispatch<React.SetStateAction<Market[]>> }) {
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
      setMarkets(prev => {
        return prev.filter((m) => m.id !== market.id)
      })
    }
  }, [timeRemaining.isExpired, market.id, setMarkets])

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

export default function MarketDisplay({
  markets,
  setMarkets,
  progress
}: {
  markets: Market[],
  setMarkets: React.Dispatch<React.SetStateAction<Market[]>>,
  progress: number
}) {
  // TODO progress needs to be made independant
  // Create a state object to track modal states for each market and answer combination
  const [modalStates, setModalStates] = useState<Record<string, { answerA: boolean, answerB: boolean }>>({})

  console.log("MARKETS IN MARKETDISPLAY", markets)

  // Helper functions to manage modal states
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
        {markets.map((market) => {
          return (
            <Card key={market.id} className="mb-4">
              <CardHeader>
                <CardTitle>
                  {market.question}
                </CardTitle>
                <CardDescription>
                  <MarketTimer market={market} setMarkets={setMarkets} />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='flex flex-row gap-2 justify-center items-center'>
                  <BetFormModal 
                    isModalOpen={getModalState(market.id, true)}
                    setIsModalOpen={(isOpen) => setModalState(market.id, true, isOpen)}
                    marketId={market.id}
                    profileId={"FIX ME LATER"}
                    isAnswerA={true}
                    teamName={market.answerA}
                  />
                  {/* <Button
                    className='w-[20%] bg-blue-700 hover:bg-blue-800' 
                    onClick={() => handleBetting(market.id, true, setBetLoading)}
                    disabled={betLoading}
                  >
                    {market.answerA}
                  </Button> */}
                  <Progress className='w-[60%]' value={progress} />
                  <BetFormModal
                    isModalOpen={getModalState(market.id, false)}
                    setIsModalOpen={(isOpen) => setModalState(market.id, false, isOpen)}
                    marketId={market.id}
                    profileId={"FIX ME LATER"}
                    isAnswerA={false}
                    teamName={market.answerB}
                  />
                  {/* <Button
                    className='w-[20%] bg-blue-700 hover:bg-blue-800' 
                    onClick={() => handleBetting(market.id, false, setBetLoading)}
                    disabled={betLoading}
                  >
                    {market.answerB}
                  </Button> */}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </CardContent>
    </Card>
  )
}
