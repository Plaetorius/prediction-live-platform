import { createSupabaseServerClient } from '@/lib/supabase/server'
import { BettingProvider } from '@/providers/BettingProvider'
import { StreamProvider } from '@/providers/StreamProvider'
import React from 'react'

interface Props {
  children: React.ReactNode
  params: Promise<{ platform: string, name: string }>
}

const getStream = async (platform: string, name: string) => {
  // Validate that this looks like a real stream request, not a static asset
  if (name.includes('.') || name.includes('/') || name.includes('\\')) {
    console.log("Rejecting request for static asset:", name)
    return null
  }

  // Validate platform
  const validPlatforms = ['twitch', 'youtube', 'kick'] // Add your valid platforms
  if (!validPlatforms.includes(platform.toLowerCase())) {
    console.log("Invalid platform:", platform)
    return null
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('streams')
    .select('*')
    .eq('platform', platform)
    .eq('name', name)
    .single()

  if (error) {
    console.error("Error retrieving stream in layout", error)
    return null
  }

  return {
    ...data,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  }
}

export const revalidate = 0 

export default async function StreamSegmentLayout({ children, params }: Props) {
  const { platform, name } = await params
  const stream = await getStream(platform, name)

  return (
    <StreamProvider initialStream={stream}>
      <BettingProvider>
        {children}
      </BettingProvider>
    </StreamProvider>
  )
}
