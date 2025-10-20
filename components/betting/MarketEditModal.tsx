import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Market, Stream } from '@/lib/types'
import { Button } from '../ui/button'
import { Edit } from 'lucide-react'
import MarketForm, { MarketFormSchema } from '../forms/MarketForm'
import { SubmitHandler } from 'react-hook-form'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Database } from '@/database.types'
import { toast } from 'sonner'
import { setMarketInMarkets } from '@/lib/markets/utils'
import { useBetting } from '@/providers/BettingProvider'

interface MarketEditModalProps {
  market: Market
  stream?: Stream
}

export default function MarketEditModal({ market, stream } : MarketEditModalProps) {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const { markets, setMarkets } = useBetting()

  const onSubmit: SubmitHandler<MarketFormSchema> = async (data) => {
    try {
      const supabase = createSupabaseClient()
      setLoading(true)
      const { data: marketData, error: marketError } = await supabase
        .from('markets')
        .update({
          question: data.question,
          answer_a: data.answerA, 
          answer_b: data.answerB,
          start_time: data.startTime,
          est_end_time: data.estEndTime,
          real_end_time: data.realEndTime || market.estEndTime,
          status: data.status,
          duration: data.duration,
          stream_id: data.streamId, 
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id)
        .select()
        .single()

      if (marketError) {
        throw marketError
      }
      
      const updatedMarket: Market = {
        id: marketData.id || '',
        question: marketData.question as string,
        answerA: marketData.answer_a as string,
        answerB: marketData.answer_b as string,
        startTime: marketData.start_time as number,
        estEndTime: marketData.est_end_time as number,
        realEndTime: marketData.real_end_time as number,
        status: marketData.status as Database["public"]["Enums"]["market_status"],
        duration: marketData.duration as number,
        streamId: marketData.stream_id as string,
        createdAt: new Date(marketData.created_at),
        updatedAt: new Date(marketData.updated_at)
      }

      setMarketInMarkets({ market: updatedMarket, markets, setMarkets })
      toast.success("Market updated successfully!")
      setIsModalOpen(false)

    } catch (error) {
      console.error("Error updating market: ", error)
      toast.error("Error updating market")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setIsModalOpen(false)
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button variant='secondary' className='opacity-50'>
          <Edit className='h-4 w-4' />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Edit Market
          </DialogTitle>
          <DialogDescription>
            Update market: {market.question}
          </DialogDescription>
        </DialogHeader>
        <MarketForm
          market={market}
          stream={stream}
          onSubmit={onSubmit}
          onCancel={handleCancel}
          context='modal'
          loading={loading}
          submitText='Update Market'
          cancelText='Cancel'
          resetOnMount={false}
        />
      </DialogContent>
    </Dialog>    
  )
}
