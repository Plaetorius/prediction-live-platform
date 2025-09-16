"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Stream } from '@/lib/types'
import { useStream } from '@/providers/stream-providers'
import React, { useEffect, useState } from 'react'

export default function StreamAdmin() {
  const [loading, setLoading] = useState<boolean>(false)
  const stream = useStream()



  
  return (
    <main className='m-4'>
      <Card>
        <CardHeader>
          <CardTitle>

          </CardTitle>
          <CardDescription>

          </CardDescription>
        </CardHeader>
        <CardContent>

        </CardContent>
      </Card>
    </main>
  )
}
