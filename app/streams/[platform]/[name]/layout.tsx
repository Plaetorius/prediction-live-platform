import { createSupabaseServerClient } from '@/lib/supabase/server'
import { StreamProvider } from '@/providers/stream-providers'
import React from 'react'

interface Props {
  children: React.ReactNode
  params: Promise<{ platform: string, name: string }>
}

const getStream = async (platform: string, name: string) => {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('streams')
    .select('*')
    .eq('platform', platform)
    .eq('name', name)
    .single()

  if (error) {
    console.error("Error retrieving stream", error)
    return null
  }

  return {
    ...data,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  }
}

export const revalidate = 0 

export default async function StreamSegmentLayout({ children, params}: Props) {
  const { platform, name } = await params
  const stream = await getStream(platform, name)

  return (
    <StreamProvider initialStream={stream}>
      {children}
    </StreamProvider>
  )
}
