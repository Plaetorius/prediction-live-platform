"use client"

import React, { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod'
import { createSupabaseClient } from '@/lib/supabase/client';
import { toast } from 'sonner'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Loading from '@/components/Loading';

const streamFormSchema = z.object({
  url: z.string().min(5, "URL is too short").max(200, "URL is too long"),
})

type StreamFormSchema = z.infer<typeof streamFormSchema>

function getPlatformAndName(url: string): { platform: string; name: string } | null {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    
    // Twitch URL patterns
    if (hostname.includes('twitch.tv')) {
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0)
      
      // Handle different Twitch URL formats:
      // https://www.twitch.tv/username
      // https://twitch.tv/username
      if (pathParts.length >= 1) {
        return {
          platform: 'twitch',
          name: pathParts[0]
        }
      }
    }
    
    // Kick URL patterns
    if (hostname.includes('kick.com')) {
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0)
      
      // Handle different Kick URL formats:
      // https://kick.com/username
      // https://www.kick.com/username
      if (pathParts.length >= 1) {
        return {
          platform: 'kick',
          name: pathParts[0]
        }
      }
    }
    
    return null
  } catch (error) {
    console.error(error)
    // Invalid URL format
    return null
  }
}

export default function CreateStream() {
  const [loading, setLoading] = useState<boolean>(false)

  const form = useForm({
    resolver: zodResolver(streamFormSchema),
    defaultValues: {
      url: '',
    }
  })

  const onSubmit: SubmitHandler<StreamFormSchema> = async (data) => {
    setLoading(true) // TODO better laoding
    const supabase = createSupabaseClient()

    const result = getPlatformAndName(data.url)
    
    if (!result) {
      toast.error('Invalid URL or unsupported platform. Please use a valid Twitch or Kick URL.')
      return
    }

    const { platform, name } = result

    const { error } = await supabase
      .from('streams')
      .insert({
        platform,
        name
      })
      
      if (error) {
        if (error.code && error.code === "23505") { // Checks for platform + name combination error
          toast.error("The stream you're trying to create already exists!")
          return
        }
        toast.error('Error creating stream!')
        console.error("Error creating stream: ", error)
        return
      }
      toast.success("Stream successfully created. Enjoy!")
    }
  
    if (loading)
      <Loading />

  return (
    <>
      <main>
        <div>Create Stream</div>
        <div>
          Admin page to create new streams on PL
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div>
              <FormField 
                control={form.control}
                name='url'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Stream URL
                    </FormLabel>
                    <FormControl>
                      <Input 
                        id="url"
                        placeholder='Ex: https://twitch.tv/username or https://kick.com/username'
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div>
              <Button
                type='submit'
              >
                Create Stream
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </>
  )
}
