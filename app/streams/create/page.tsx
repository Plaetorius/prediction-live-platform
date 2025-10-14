"use client"

import React, { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod'
import { createSupabaseClient } from '@/lib/supabase/client';
import { toast } from 'sonner'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
;
import { ArrowLeft, Link as LinkIcon, Twitch, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
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
    setLoading(true)
    const supabase = createSupabaseClient()

    const result = getPlatformAndName(data.url)
    
    if (!result) {
      toast.error('Invalid URL or unsupported platform. Please use a valid Twitch or Kick URL.')
      setLoading(false)
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
          setLoading(false)
          return
        }
        toast.error('Error creating stream!')
        console.error("Error creating stream: ", error)
        setLoading(false)
        return
      }
      toast.success("Stream successfully created. Enjoy!")
      setLoading(false)
      form.reset()
    }
      
  if (loading)
    return <Loading />

  return (
    <div className="min-h-screen p-4">
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/streams" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Streams
          </Link>
        </Button>
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold">Add Stream</h1>
          <p className="text-muted-foreground text-lg">
            Add your favorite streamer to start creating prediction markets
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Supported Platforms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-red-500" />
              Supported Platforms
            </CardTitle>
            <CardDescription>
              We currently support these streaming platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <Twitch className="h-8 w-8 text-purple-400" />
                <div>
                  <h3 className="font-semibold">Twitch</h3>
                  <p className="text-sm text-muted-foreground">twitch.tv/username</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-400 ml-auto" />
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <Zap className="h-8 w-8 text-green-400" />
                <div>
                  <h3 className="font-semibold">Kick</h3>
                  <p className="text-sm text-muted-foreground">kick.com/username</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-400 ml-auto" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-6 w-6 text-red-500" />
              Stream Information
            </CardTitle>
            <CardDescription>
              Enter the stream URL to add it to the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField 
                  control={form.control}
                  name='url'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stream URL</FormLabel>
                      <FormControl>
                        <Input 
                          id="url"
                          placeholder="https://twitch.tv/username or https://kick.com/username"
                          disabled={loading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>• Copy the full URL from your browser</p>
                        <p>• Make sure the streamer exists on the platform</p>
                        <p>• The stream will be available for betting once added</p>
                      </div>
                    </FormItem>
                  )}
                />
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type='submit'
                    size="lg"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Adding Stream...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Add Stream
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type='button'
                    variant="outline"
                    size="lg"
                    asChild
                    className="flex-1"
                  >
                    <Link href="/streams">
                      Cancel
                    </Link>
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="border-amber-500/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-amber-400 mt-1" />
              <div className="space-y-3">
                <h3 className="font-semibold text-amber-600">Tips for adding streams</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Make sure the streamer is active and has content</li>
                  <li>• Popular streamers tend to have more betting activity</li>
                  <li>• You can add multiple streams from the same platform</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}