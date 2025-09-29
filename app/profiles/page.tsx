"use client"

import React, { useEffect, useState } from 'react'
import { Profile } from '@/lib/types'
import { createSupabaseClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserPlus, Users, Shield, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Loading from '@/components/Loading'
import { useWeb3AuthConnect } from "@web3auth/modal/react"


export default function Profiles() {
  const [loading, setLoading] = useState<boolean>(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const { isConnected } = useWeb3AuthConnect()

  useEffect(() => {
    async function getProfiles() {
      const supabase = createSupabaseClient()

      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select()
        .range(0, 10)

        if (error) {
            setLoading(false)
            toast.error("Error retrieving profiles")
            console.error(error)
            return 
        }
      console.log("Retrieved data", data)
      setProfiles(data.map((profile) => { 
        if (!profile) return null
        return {
          ...profile,
          createdAt: new Date(profile.created_at),
          updatedAt: new Date(profile.updated_at)
        }
      }).filter((profile): profile is Profile => profile !== null))
      setLoading(false)
    }
    getProfiles()
  }, [])

  if (loading)
    return <Loading />

  if (!isConnected) {
    return (
      <main className='p-4'>
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Admin Access Required</h2>
          <p className="text-gray-400 mb-6">Please connect your wallet to access the admin profiles page</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Homepage
            </Button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className='p-4'>
      <div className='flex flex-row gap-4 items-center mb-6'>
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-white">
            Admin - All Profiles
          </h2>
        </div>
        <div className="flex gap-2">
          <Link href="/profile">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              <Users className="mr-2 h-4 w-4" />
              My Profile
            </Button>
          </Link>
          <Button asChild variant="default" className='size-8'>
            <Link href="/profiles/create">
              <UserPlus />
            </Link>
          </Button>
        </div>
      </div>
      <div className='grid grid-cols-4 gap-4'>
        {profiles.map((profile) => {
          if (!profile) return null
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