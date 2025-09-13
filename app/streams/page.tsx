"use client"

import React, { useEffect, useState } from 'react'
import { Stream } from '@/lib/types'
import { createSupabaseClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TicketPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Loading from '@/components/Loading'


export default function Streams() {
  const [loading, setLoading] = useState<boolean>(false)
  const [streams, setStreams] = useState<Stream[]>([])

  useEffect(() => {
    async function getStreams() {
      const supabase = createSupabaseClient()

      setLoading(true)
      const { data, error } = await supabase
        .from('streams')
        .select()
        .range(0, 5)

        if (error) {
        setLoading(false)
        toast.error("Error retrieving streams")
        console.error(error)
        return 
      }
      console.log("Retrieved data", data)
      setStreams(data.map((stream) => { 
        return {
          ...stream,
          createdAt: new Date(stream.created_at),
          updatedAt: new Date(stream.updated_at)
        }
      }))
      setLoading(false)
    }
    getStreams()
  }, [])

  if (loading)
    return <Loading />

  return (
    <main className='p-4'>
      <div className='flex flex-row gap-4 items-center mb-4'>
        <h2>
          Streams
        </h2>
        <Button asChild variant="default" className='size-8'>
          <Link href="/streams/create">
            <TicketPlus />
          </Link>
        </Button>
      </div>
      <div className='grid grid-cols-4 gap-4'>
        {streams.map((stream) => {
          return (
            // TODO use an iframe later
            <Card key={stream.id}>
              <CardHeader>
                <CardTitle>
                  {stream.platform} / {stream.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant='outline'>
                  League Of Legends
                </Badge>
              </CardContent>
              <CardFooter>
                <Button asChild>
                  <Link href={`/streams/${stream.platform}/${stream.name}`}>
                    Watch
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </main>
  )
}
