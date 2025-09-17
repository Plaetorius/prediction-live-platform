"use client"

import Loading from '@/components/Loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/supabase/client'
import { BetListeners, BetChannelOptions, Stream } from '@/lib/types'
import { useStream } from '@/providers/stream-providers'
import React, { useEffect, useState, useCallback } from 'react'
import { useBetChannel } from '@/hooks/useBetChannel'
import { Button } from '@/components/ui/button'
import MarketFormModal from './MarketFormModal'

export default function StreamAdmin() {
  const [loading, setLoading] = useState<boolean>(false)
  const stream = useStream()
  const [logs, setLogs] = useState<any[]>([])
  const [isSimulating, setIsSimulating] = useState<boolean>(false)
  const [simulationProgress, setSimulationProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 })
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  const betListeners: BetListeners = {
    onTeam1: (payload: any) => { 
      console.log("onTeam1", payload)
      setLogs(prevLogs => [...prevLogs, payload])
      
      // Update progress when receiving simulated bets through websocket
      if (isSimulating && payload.betId?.includes('bet_')) {
        setSimulationProgress(prev => {
          const newCurrent = Math.min(prev.current + 1, prev.total)
          
          // Auto-complete simulation when all bets are received
          if (newCurrent >= prev.total) {
            setTimeout(() => {
              setIsSimulating(false)
              setSimulationProgress({ current: 0, total: 0 })
            }, 1000) // Small delay to show completion
          }
          
          return {
            ...prev,
            current: newCurrent
          }
        })
      }
    },
    onTeam2: (payload: any) => {
      console.log("onTeam2", payload)
      setLogs(prevLogs => [...prevLogs, payload])
      
      // Update progress when receiving simulated bets through websocket
      if (isSimulating && payload.betId?.includes('bet_')) {
        setSimulationProgress(prev => {
          const newCurrent = Math.min(prev.current + 1, prev.total)
          
          // Auto-complete simulation when all bets are received
          if (newCurrent >= prev.total) {
            setTimeout(() => {
              setIsSimulating(false)
              setSimulationProgress({ current: 0, total: 0 })
            }, 1000) // Small delay to show completion
          }
          
          return {
            ...prev,
            current: newCurrent
          }
        })
      }
    },
  }

  const realtimeOptions: BetChannelOptions = {
    broadcastSelf: true,
    kind: 'all' 
  }

  const { 
    channelRef,
    send,
    sendBetTeam1,
    sendBetTeam2
  } = useBetChannel(
    stream?.platform || '', 
    stream?.name || '', 
    betListeners, 
    realtimeOptions
  )

  // Simulation function for betting waves
  const simulateBettingWave = useCallback(async (numBets: number = 20) => {
    if (isSimulating) return
    
    setIsSimulating(true)
    setSimulationProgress({ current: 0, total: numBets })
    
    const duration = 30000 // 30 seconds
    const interval = duration / numBets
    
    for (let i = 0; i < numBets; i++) {
      // Random delay between 0.5x and 1.5x the calculated interval
      const randomDelay = interval * (0.5 + Math.random())
      
      await new Promise(resolve => setTimeout(resolve, randomDelay))
      
      // Random team selection (50/50 chance)
      const isTeam1 = Math.random() < 0.5
      
      // Random bet amount between $1 and $100
      const amount = Math.floor(Math.random() * 100) + 1
      
      // Random user ID for simulation
      const userId = `user_${Math.floor(Math.random() * 1000)}`
      
      const betPayload = {
        amount,
        userId,
        timestamp: new Date().toISOString(),
        betId: `bet_${Date.now()}_${userId}`
      }
      
      // Send the bet - progress will be updated via websocket listeners
      if (isTeam1) {
        sendBetTeam1(betPayload)
      } else {
        sendBetTeam2(betPayload)
      }
    }
    
    // Set a timeout to end simulation if not all bets are received
    // This handles cases where websocket might be slow or fail
    setTimeout(() => {
      if (isSimulating) {
        setIsSimulating(false)
        setSimulationProgress({ current: 0, total: 0 })
      }
    }, 35000) // 5 seconds after the last bet should be sent
  }, [isSimulating, sendBetTeam1, sendBetTeam2])

  if (!stream)
    return <Loading />
  
  return (
    <main className='m-4'>
      <Card>
        <CardHeader>
          <CardTitle>
            {stream.platform} / {stream.name}&apos;s admin page
          </CardTitle>
          <CardDescription>

          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-3 mb-4'>
            <Button onClick={() => sendBetTeam1({ amount: 1 })}>
              Send bet team 1
            </Button>
            <Button onClick={() => sendBetTeam2({ amount: 1 })}>
              Send bet team 2
            </Button>
          </div>
          
          {/* Simulation Controls */}
          <div className='border-t pt-4 mb-4'>
            <h4 className='text-lg font-semibold mb-3'>Betting Simulation</h4>
            <div className='grid grid-cols-2 gap-3 mb-3'>
              <Button 
                onClick={() => simulateBettingWave(10)}
                disabled={isSimulating}
                variant="outline"
              >
                Simulate 10 bets (30s)
              </Button>
              <Button 
                onClick={() => simulateBettingWave(100)}
                disabled={isSimulating}
                variant="outline"
              >
                Simulate 100 bets (30s)
              </Button>
            </div>
            
            {isSimulating && (
              <div className='space-y-2'>
                <div className='text-sm text-gray-600'>
                  Simulating... {simulationProgress.current} / {simulationProgress.total} bets received
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div 
                    className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                    style={{ 
                      width: `${(simulationProgress.current / simulationProgress.total) * 100}%` 
                    }}
                  />
                </div>
                <div className='text-xs text-gray-500'>
                  Progress updates via websocket data
                </div>
              </div>
            )}
          </div>
          
          {/* Market Form Modal */}
          <MarketFormModal 
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
            stream={stream}
          />
          
          <div className='mt-4 '>
            <h4>
              Logs
            </h4>
            <div className='p-4 rounded-l bg-gray-100'>
              {logs.map((log, index) => {
                return (
                  <div key={index}>
                    {JSON.stringify(log)}
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
