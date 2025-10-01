import { Constants } from '@/database.types'
import { addDuration, formatTimestampForInput, now, parseInputToTimestamp, secondsToMs } from '@/lib/timezoneUtils'
import { Market, Stream } from '@/lib/types'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import z from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Button } from '../ui/button'

export const marketFormSchema = z.object({
  id: z.string().optional(),
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

export type MarketFormSchema = z.infer<typeof marketFormSchema>

export type MarketFormContext = 'modal' | 'page'

interface MarketFormProps {
  market?: Market
  stream?: Stream
  onSubmit: SubmitHandler<MarketFormSchema>
  onCancel?: () => void
  context?: MarketFormContext
  loading?: boolean
  submitText?: string
  cancelText?: string
  resetOnMount?: boolean
  showButtons?: boolean
}

export default function MarketForm({
  market,
  stream,
  onSubmit,
  onCancel,
  context = 'page',
  loading = false,
  submitText = 'Create Market',
  cancelText = 'Cancel',
  resetOnMount = false,
  showButtons = true
}: MarketFormProps) {
  const [internalLoading, setInternalLoading] = useState<boolean>(false)
  const isSubmitting = loading || internalLoading

  const form = useForm({
    resolver: zodResolver(marketFormSchema),
    defaultValues: {
      id: market?.id || '',
      question: market?.question || 'First blood?' + now(),
      answerA: market?.answerA ||  'TH',
      answerB: market?.answerB || 'NAVI',
      streamId: market?.streamId || stream?.id || '',
      startTime: market?.startTime || now(),
      duration: market?.duration || 300, // Duration in seconds
      estEndTime:market?.estEndTime || now() + secondsToMs(300), // Convert to milliseconds for calculation
      status: market?.status || 'open'
    }
  })

  // Watch for changes in startTime and duration to update estEndTime
  const startTime = form.watch('startTime')
  const duration = form.watch('duration')

  // Reset form with current time when modal opens (only for creation, not editing)
  useEffect(() => {
    if (resetOnMount || (context === 'modal' && !market)) {
      const defaultValues = getDefaultValues()
      form.reset(defaultValues)
    }
  }, [resetOnMount, context, form, stream?.id, market])
  // Maybe button an empty dependency array in the useEffect would work too

  useEffect(() => {
    if (startTime && duration) {
      const endTime = addDuration(startTime, secondsToMs(duration))
      form.setValue('estEndTime', endTime)
    }
  }, [startTime, duration, form])

  const handleSubmit = async (data: MarketFormSchema) => {
    setInternalLoading(true)
    try {
      await onSubmit(data)
    } finally {
      setInternalLoading(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else if (context === 'page') {
      form.reset()
    }
  }

  const getDefaultValues = () => {
    const currentTime = now()
    return {
      id: market?.id || '',
      question: market?.question || 'First blood?' + currentTime,
      answerA: market?.answerA || 'TH',
      answerB: market?.answerB || 'NAVI',
      streamId: market?.streamId || stream?.id || '',
      startTime: market?.startTime || currentTime,
      duration: market?.duration || 300,
      estEndTime: market?.estEndTime || currentTime + secondsToMs(300),
      status: market?.status || 'open' as const
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          control={form.control}
          name='question'
          render={({ field }) => (
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
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
        
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
        </div>

        <FormField
          control={form.control}
          name='streamId'
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Stream ID {stream && `(${stream.platform} / ${stream.name})`}
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

        {showButtons && (
          <div className='flex gap-2 pt-4'>
            <Button 
              type='submit' 
              disabled={isSubmitting}
              className='flex-1'
              >
              {internalLoading ? 'Processing...' : submitText}
            </Button>
            <Button 
              type='button' 
              variant='outline'
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {cancelText}  
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
