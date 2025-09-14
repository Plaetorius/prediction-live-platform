"use client"

import React, { useEffect, useState } from 'react'
import { Stream } from '@/lib/types'
import { createSupabaseClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, Eye, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Loading from '@/components/Loading'
import { toast } from 'sonner'
import { useParams } from 'next/navigation'

export default function StreamPage() {
  const { platform, stream } = useParams<{ platform: string; stream: string }>()
  const [loading, setLoading] = useState<boolean>(false)
  const [streamData, setStreamData] = useState<Stream | null>(null)

  useEffect(() => {
    async function getStream() {
      const supabase = createSupabaseClient()

      setLoading(true)
      const { data, error } = await supabase
        .from('streams')
        .select()
        .eq('platform', platform)
        .eq('name', stream)
        .single()

      if (error) {
        setLoading(false)
        toast.error("Error retrieving stream")
        console.error(error)
        return 
      }
      
      console.log("Retrieved stream data", data)
      setStreamData({
        ...data,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      })
      setLoading(false)
    }
    getStream()
  }, [platform, stream])

  // Fonction pour générer l'URL d'embed selon la plateforme
  const getEmbedUrl = (platform: string, streamName: string) => {
    switch (platform.toLowerCase()) {
      case 'twitch':
        return `https://player.twitch.tv/?channel=${streamName}&parent=${window.location.hostname}`
      case 'youtube':
        return `https://www.youtube.com/embed/${streamName}`
      case 'kick':
        return `https://player.kick.com/${streamName}`
      default:
        return `https://player.twitch.tv/?channel=${streamName}&parent=${window.location.hostname}`
    }
  }

  if (loading)
    return <Loading />

  if (!streamData)
    return (
      <main className='p-4'>
        <div className='mb-6'>
          <Button asChild variant="outline">
            <Link href="/streams">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Streams
            </Link>
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Stream not found.</p>
        </div>
      </main>
    )

  return (
    <main className='p-4'>
      <div className='mb-6'>
        <Button asChild variant="outline">
          <Link href="/streams">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Streams
          </Link>
        </Button>
      </div>
      
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Stream Video */}
        <div className='lg:col-span-2'>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {streamData.platform}
                </Badge>
                {streamData.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                <iframe
                  src={getEmbedUrl(streamData.platform, streamData.name)}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allowFullScreen
                  className="w-full h-full"
                  title={`${streamData.platform} stream - ${streamData.name}`}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stream Info */}
        <div className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stream Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Created:</span>
                <span>{streamData.createdAt.toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="font-medium">Platform:</span>
                <Badge variant="outline" className="capitalize">
                  {streamData.platform}
                </Badge>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">About this stream</h3>
                <p className="text-muted-foreground text-sm">
                  This is a {streamData.platform} stream by {streamData.name}. 
                  Enjoy watching and don't forget to follow for more content!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stream Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stream ID:</span>
                <span className="font-mono text-sm">{streamData.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="text-sm">{streamData.updatedAt.toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
