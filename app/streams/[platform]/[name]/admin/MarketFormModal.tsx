'use client'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Stream } from '@/lib/types'
import { Constants } from '@/database.types'
import { zodResolver } from '@hookform/resolvers/zod'
import { RealtimeChannel } from '@supabase/supabase-js'
import React, { useState, useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatTimestampForInput, parseInputToTimestamp, addDuration, secondsToMs, now } from '@/lib/timezoneUtils'

interface MarketFormModalProps {
  isModalOpen: boolean
  setIsModalOpen: (open: boolean) => void
  stream: Stream | null
  sendNewMarket: (payload: any) => void
}

const marketFormSchema = z.object({
  question: z.string().min(5, 'Question is too short!').max(256, 'Question is too long!'),
  answerA: z.string().min(1, 'Answer A is too short!').max(50, "Answer A is too long!"),
  answerB: z.string().min(1, 'Answer B is too short!').max(50, "Answer B is too long!"),
  startTime: z.number().min(0, "Start time must be valid"),
  estEndTime: z.number().min(0, "End time must be valid").optional(),
  realEndTime: z.number().min(0, "Real end time must be valid").optional(),
  status: z.enum(Constants.public.Enums.market_status).optional(),
  duration: z.number().min(10, "Duration must be at least 10 seconds").max(900, "Duration can't exceed 900 seconds"),
  streamId: z.string().min(1, 'Stream ID is required').max(256, 'Stream ID is too long!')
})

type MarketFormSchema = z.infer<typeof marketFormSchema>

export default function MarketFormModal({
  isModalOpen,
  setIsModalOpen,
  stream,
  sendNewMarket,
}: MarketFormModalProps) {
  const [loading, setLoading] = useState<boolean>(false)

  const form = useForm({
    resolver: zodResolver(marketFormSchema),
    defaultValues: {
      question: 'First blood?' + now(),
      answerA: 'TH',
      answerB: 'NAVI',
      streamId: stream?.id || '',
      startTime: now(),
      duration: 300, // Duration in seconds
      estEndTime: now() + secondsToMs(300), // Convert to milliseconds for calculation
      status: 'open'
    }
  })

  // Watch for changes in startTime and duration to update estEndTime
  const startTime = form.watch('startTime')
  const duration = form.watch('duration')

  // Reset form with current time when modal opens
  useEffect(() => {
    if (isModalOpen) {
      const currentTime = now()
      form.reset({
        question: 'First blood?' + currentTime,
        answerA: 'TH',
        answerB: 'NAVI',
        streamId: stream?.id || '',
        startTime: currentTime,
        duration: 300,
        estEndTime: currentTime + secondsToMs(300),
        status: 'open'
      })
    }
  }, [isModalOpen, form, stream?.id])

  useEffect(() => {
    if (startTime && duration) {
      const endTime = addDuration(startTime, secondsToMs(duration))
      form.setValue('estEndTime', endTime)
    }
  }, [startTime, duration, form])

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
          est_end_time: data.estEndTime || data.startTime + secondsToMs(data.duration), // Calculate if not provided
          real_end_time: data.realEndTime || null,
          status: data.status,
          stream_id: data.streamId,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating market:", error)
        toast.error("Error creating market: " + error.message)
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
        streamId: marketData.stream_id
      })
      form.reset()
      setIsModalOpen(false)
    } catch (error) {
      console.error("Unexpected error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='border-t pt-4 mb-4'>
      <h4 className='text-lg font-semibold mb-3'>Stream Management</h4>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary">
            Create New Market
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Market Creation</DialogTitle>
            <DialogDescription>
              Create a new market for <span className='font-semibold'>{stream?.platform} / {stream?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className='grid gap-2'>
                <FormField
                  control={form.control}
                  name='question'
                  render={({ field}) => (
                    <FormItem>
                      <FormLabel>
                        Question
                      </FormLabel>
                      <FormControl>
                        <Input
                          id='question'
                          placeholder='What teams take first blood?'
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className='grid grid-cols-2 gap-2'>
                  <FormField
                    control={form.control}
                    name='answerA'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Answer A
                        </FormLabel>
                        <FormControl>
                          <Input
                            id='answerA'
                            placeholder='Team Heretics (TH)'
                            {...field}
                            />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='answerB'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Answer B
                        </FormLabel>
                        <FormControl>
                          <Input
                            id='answerB'
                            placeholder='Natus Vincere (NAVI)'
                            {...field}
                            />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name='startTime'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Start Time
                      </FormLabel>
                      <FormControl>
                         <Input
                           id='startTime'
                           type='datetime-local'
                           step='1'
                           {...field}
                           value={field.value ? formatTimestampForInput(field.value) : ''}
                           onChange={(e) => field.onChange(parseInputToTimestamp(e.target.value))}
                         />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='estEndTime'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        End Time
                      </FormLabel>
                      <FormControl>
                         <Input
                           id='estEndTime'
                           type='datetime-local'
                           step='1'
                           {...field}
                           value={field.value ? formatTimestampForInput(field.value) : ''}
                           onChange={(e) => field.onChange(parseInputToTimestamp(e.target.value))}
                           disabled
                         />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='duration'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Duration (seconds)
                      </FormLabel>
                      <FormControl>
                        <Input
                          id='duration'
                          type='number'
                          min='10'
                          max='900'
                          placeholder='300'
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                 <FormField
                   control={form.control}
                   name='status'
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>
                         Status
                       </FormLabel>
                       <FormControl>
                         <Select onValueChange={field.onChange} value={field.value}>
                           <SelectTrigger>
                             <SelectValue placeholder='Select a status...' />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectGroup>
                               <SelectItem value='draft' className='bg-gray-200 my-1'>Draft</SelectItem>
                               <SelectItem value='open' className='bg-green-200 my-1'>Open</SelectItem>
                               <SelectItem value='timeout' className='bg-blue-200 my-1'>Timeout</SelectItem>
                               <SelectItem value='stopped' className='bg-orange-200 my-1'>Stopped</SelectItem>
                               <SelectItem value='error' className='bg-red-200 my-1'>Error</SelectItem>
                               <SelectItem value='voided' className='bg-slate-200 my-1'>Voided</SelectItem>
                             </SelectGroup>
                           </SelectContent>
                         </Select>
                       </FormControl>
                     </FormItem>
                   )}
                 />
                <FormField
                  control={form.control}
                  name='streamId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Stream ID ({stream?.platform} / {stream?.name})
                      </FormLabel>
                      <FormControl>
                        <Input
                          id='streamId'
                          placeholder='Enter a stream ID...'
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className='flex gap-2 pt-4'>
                  <Button 
                    type='submit' 
                    disabled={loading}
                    className='flex-1'
                  >
                    {loading ? 'Creating...' : 'Create Market'}
                  </Button>
                  <Button 
                    type='button' 
                    variant='outline'
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
