'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createSupabaseClient } from '@/lib/supabase/client'
import { now } from '@/lib/timezoneUtils'
import { Market, ResultPayload } from '@/lib/types'
import { Trophy } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { keccak256, toHex } from 'viem'
import { BettingPoolABI, BETTING_POOL_ADDRESS } from '@/lib/contracts/BettingPoolABI'
import { SUPPORTED_CHAINS } from '@/providers/ProfileProvider'
import { useResult } from '@/providers/ResultProvider'

interface MarketResolutionModalProps {
  market: Market
}

export default function MarketResolutionModal({ market }: MarketResolutionModalProps) {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [txStep, setTxStep] = useState<'idle' | 'sending' | 'confirming' | 'success'>('idle')
  const [pendingResolution, setPendingResolution] = useState<boolean | null>(null)
  
  const { sendResult } = useResult()

  const { isConnected, chainId } = useAccount()
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { switchChain } = useSwitchChain()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const handleResolution = async (marketId: string, isAnswerA: boolean) => {
    try {
      // Check wallet connection
      if (!isConnected) {
        toast.error("Please connect your wallet first.")
        return
      }

      // Check if on correct chain
      if (chainId !== SUPPORTED_CHAINS.CHILIZ_DEV) {
        toast.error("Switching to Spicy Testnet...")
        await switchChain({ chainId: SUPPORTED_CHAINS.CHILIZ_DEV })
        return
      }

      setLoading(true)
      setTxStep('sending')
      setPendingResolution(isAnswerA)

      // Convert marketId (UUID) to poolId (same logic as in BetFormModal)
      const poolId = BigInt(keccak256(toHex(marketId)).slice(0, 10))
      
      // Send transaction to resolve pool
      writeContract({
        address: BETTING_POOL_ADDRESS,
        abi: BettingPoolABI,
        functionName: "resolvePool",
        args: [
          poolId, // PoolId generated from marketId
          isAnswerA ? 1 : 2 // 1 = Resolution.A, 2 = Resolution.B (0 = Pending)
        ],
      })

      setTxStep('confirming')
      toast.info("Transaction sent! Waiting for confirmation...")

    } catch (error) {
      toast.error("Error sending resolution transaction.")
      console.error("Error sending resolution transaction:", error)
      setTxStep('idle')
    } finally {
      setLoading(false)
    }
  }

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash && pendingResolution !== null) {
      setTxStep('success')
      toast.success("Pool resolved successfully!")

      // Update database after successful transaction
      updateMarketResolution(market.id, pendingResolution)
      const payload: ResultPayload = {
        marketId: market.id,
        isAnswerA: pendingResolution,
      }
      sendResult(payload)
      setPendingResolution(null)
    }
  }, [isSuccess, hash, market.id, pendingResolution])

  // Handle transaction error
  useEffect(() => {
    if (error) {
      toast.error("Transaction failed. Please try again.")
      setTxStep('idle')
      setLoading(false)
      setPendingResolution(null)
    }
  }, [error])

  const updateMarketResolution = async (marketId: string, isAnswerA: boolean) => {
    const supabase = createSupabaseClient()
    try {
      const { error } = await supabase
        .from('markets')
        .update({
          is_answer_a: isAnswerA,
          real_end_time: now(),
          updated_at: new Date().toISOString(),
          status: 'resolved' as const
        })
        .eq('id', marketId)
        .select()
      
      if (error) {
        throw error
      }

      toast.success("Resolution set!")
      setIsModalOpen(false)
    } catch (error) {
      toast.error("Error updating market resolution.")
      console.error("Error updating market resolution:", error)
    }
  }

  const isDisabled = loading || isPending || isConfirming || (market.status !== 'open' && market.status !== 'timeout' && market.status !== 'stopped' && market.status !== 'draft')

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button variant='secondary' className='opacity-50'>
          <Trophy className='h-4 w-4' />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Pick a resolution
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className='grid grid-cols-2 gap-4'>
          <Button 
            onClick={() => handleResolution(market.id, true)} 
            disabled={isDisabled}
            className={txStep === 'sending' || txStep === 'confirming' ? 'opacity-50' : ''}
          >
            {txStep === 'sending' ? 'Sending...' : 
              txStep === 'confirming' ? 'Confirming...' : 
              market.answerA
            }
          </Button>
          <Button 
            onClick={() => handleResolution(market.id, false)} 
            disabled={isDisabled}
            className={txStep === 'sending' || txStep === 'confirming' ? 'opacity-50' : ''}
          >
            {txStep === 'sending' ? 'Sending...' : 
              txStep === 'confirming' ? 'Confirming...' : 
              market.answerB
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
