"use client"

import React, { useEffect, useState } from 'react'
import { Profile } from '@/lib/types'
import { createSupabaseClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Loading from '@/components/Loading'


export default function Profiles() {
  const [loading, setLoading] = useState<boolean>(false)
  const [profiles, setProfiles] = useState<Profile[]>([])

  useEffect(() => {
    async function getProfiles() {
      const supabase = createSupabaseClient()

      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select()
        .range(0, 5)

        if (error) {
            setLoading(false)
            toast.error("Error retrieving profiles")
            console.error(error)
            return 
        }
      console.log("Retrieved data", data)
      setProfiles(data.map((profile) => { 
        return {
          ...profile,
          createdAt: new Date(profile.created_at),
          updatedAt: new Date(profile.updated_at)
        }
      }))
      setLoading(false)
    }
    getProfiles()
  }, [])

  if (loading)
    return <Loading />

  return (
    <main className='p-4'>
      <div className='flex flex-row gap-4 items-center mb-4'>
        <h2>
          Profiles
        </h2>
        <Button asChild variant="default" className='size-8'>
          <Link href="/profiles/create">
            <UserPlus />
          </Link>
        </Button>
      </div>
      <div className='grid grid-cols-4 gap-4'>
        {profiles.map((profile) => {
          return (
            <Card key={profile.id}>
              <CardHeader>
                <CardTitle>
                  {profile.displayName} {profile.username}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant='outline'>
                  Member since {profile.createdAt.getFullYear()}-{String(profile.createdAt.getMonth() + 1).padStart(2, '0')}-{String(profile.createdAt.getDate()).padStart(2, '0')}
                </Badge>
              </CardContent>
              <CardFooter>
                <Button asChild>
                  <Link href={`/profiles/${profile.username}`}>
                    Go to Profile
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