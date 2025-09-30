'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createSupabaseClient } from '@/lib/supabase/client'
import { now } from '@/lib/timezoneUtils'
import { Market } from '@/lib/types'
import { Trophy } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'

interface MarketResolutionModalProps {
  market: Market
}

export default function MarketResolutionModal({ market }: MarketResolutionModalProps) {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  const handleResolution = async (marketId: string, isAnswerA: boolean) => {
    const supabase = createSupabaseClient()
    try {
      setLoading(true)
      const { data, error } = await supabase
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

        // TODO here, send the TX for the resolution

        toast.success("Resolution set!")

    } catch (error) {
      toast.error("Error setting outcome.")
      console.error("Error setting outcome:", error)
    } finally {
      setLoading(false)
      setIsModalOpen(false)
    }
  }

  const isDisabled = loading || (market.status !== 'open' && market.status !== 'timeout' && market.status !== 'stopped' && market.status !== 'draft')

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
          <Button onClick={() => handleResolution(market.id, true)} disabled={isDisabled}>
            {market.answerA}
          </Button>
          <Button onClick={() => handleResolution(market.id, false)} disabled={isDisabled}>
            {market.answerB}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
