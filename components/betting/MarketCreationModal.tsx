'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Stream } from '@/lib/types'
import { Constants } from '@/database.types'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useState, useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatTimestampForInput, parseInputToTimestamp, addDuration, secondsToMs, now } from '@/lib/timezoneUtils'
import { Plus } from 'lucide-react'
import MarketForm, { MarketFormSchema } from '../forms/MarketForm'

interface MarketFormModalProps {
  stream: Stream | null
  sendNewMarket: (payload: any) => void
}

export default function MarketFormModal({
  stream,
  sendNewMarket,
}: MarketFormModalProps) {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)


  const onSubmit: SubmitHandler<MarketFormSchema> = async (data) => {
    setLoading(true)
    const supabase = createSupabaseClient()

    try {
      const { data: marketData, error } = await supabase
        .from('markets')
        .insert({
          question: data.question,
          answer_a: data.answerA,
          answer_b: data.answerB,
          start_time: data.startTime, // Send Unix timestamp directly
          duration: data.duration, // Store duration in seconds (as expected by database)
          est_end_time: data.estEndTime || data.startTime + 300000, // Calculate if not provided
          real_end_time: data.realEndTime || null,
          status: data.status,
          stream_id: data.streamId,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating market:", error)
        toast.error("Error creating market. Please try again.")
        return
      }

      toast.success("Market created successfully!")
      sendNewMarket({
        id: marketData.id,
        question: marketData.question,
        answerA: marketData.answer_a,
        answerB: marketData.answer_b,
        startTime: marketData.start_time,
        duration: marketData.duration,
        estEndTime: marketData.est_end_time,
        status: marketData.status,
        streamId: marketData.stream_id,
        createdAt: marketData.created_at,
        updatedAt: marketData.updated_at,
      })
      setIsModalOpen(false)
    } catch (error) {
      console.error("Unexpected error:", error)
      toast.error("An unexpected error occurred")
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
        <Button variant='default'>
          <Plus className='h-4 w-4' />
          New Market
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Market Creation</DialogTitle>
          <DialogDescription>
            Create a new market for <span className='font-semibold'>{stream?.platform} / {stream?.name}</span>
          </DialogDescription>
        </DialogHeader>
        <MarketForm
          stream={stream}
          onSubmit={onSubmit}
          onCancel={handleCancel}
          context='modal'
          loading={loading}
          submitText='Create Market'
          cancelText='Cancel'
          resetOnMount={true}
        />
      </DialogContent>
    </Dialog>
  )
}
