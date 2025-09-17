'use client'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Stream } from '@/lib/types'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

interface MarketFormModalProps {
  isModalOpen: boolean
  setIsModalOpen: (open: boolean) => void
  stream: Stream | null
}

const marketFormSchema = z.object({
  question: z.string().min(5, 'Question is too short!').max(256, 'Question is too long!'),
  answerA: z.string().min(1, 'Answer A is too short!').max(50, "Answer A is too long!"),
  answerB: z.string().min(1, 'Answer B is too short!').max(50, "Answer B is too long!"),
  startTime: z.date(),
  duration: z.number().min(10, "Duration must be at least 10 seconds").max(900, "Duration can't exceed 900 seconds"),
  streamId: z.string().min(1, 'Stream ID is required').max(256, 'Stream ID is too long!')
})

type MarketFormSchema = z.infer<typeof marketFormSchema>

export default function MarketFormModal({
  isModalOpen,
  setIsModalOpen,
  stream
}: MarketFormModalProps) {
  const [loading, setLoading] = useState<boolean>(false)

  const form = useForm({
    resolver: zodResolver(marketFormSchema),
    defaultValues: {
      question: '',
      answerA: '',
      answerB: '',
      startTime: new Date(),
      duration: 300,
      streamId: stream?.id || ''
    }
  })

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
          start_time: data.startTime.toISOString(),
          duration: data.duration,
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
                           {...field}
                           value={field.value ? new Date(field.value.getTime() - field.value.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                           onChange={(e) => field.onChange(new Date(e.target.value))}
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
                  name='streamId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Stream ID
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
