import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { isMarketActive, getTimeRemaining } from '@/lib/timezoneUtils'
import { Market } from '@/lib/types'
import React, { useEffect, useState } from 'react'

// Timer component for individual market countdown
function MarketTimer({ market }: { market: Market }) {
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

export default function MarketDisplay({ markets, progress }: { markets: Market[], progress: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Predictions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {markets.map((markets) => {
          return (
            <Card key={markets.id} className="mb-4">
              <CardHeader>
                <CardTitle>
                  {markets.question}
                </CardTitle>
                <CardDescription>
                  <MarketTimer market={markets} />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='flex flex-row gap-2 justify-center items-center'>
                  <Button className='w-[20%] bg-blue-700 hover:bg-blue-800'>
                    {markets.answerA}
                  </Button>
                  <Progress className='w-[60%]' value={progress} />
                  <Button className='w-[20%] bg-blue-700 hover:bg-blue-800'>
                    {markets.answerB}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </CardContent>
    </Card>
  )
}
