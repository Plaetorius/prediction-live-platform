"use client"

import React, { useEffect, useState } from 'react'
import { Profile } from '@/lib/types'
import { createSupabaseClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Loading from '@/components/Loading'
import { toast } from 'sonner'
import { useParams } from 'next/navigation'
import Image from 'next/image'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const [loading, setLoading] = useState<boolean>(false)
  const [profile, setProfile] = useState<Profile | null>(null)

  function xpForLevel(level: number, base: number = 100, growth: number = 1.5): number {
    if (level <= 1) return base
    return base * Math.pow(growth, level - 1)
  }

  function calculateLevel(xp: number, base: number = 100, growth: number = 1.5) {
    let level = 1
    let totalXpSpent = 0

    while (true) {
      const requiredForNext = xpForLevel(level, base, growth)
      if (xp < totalXpSpent + requiredForNext) {
        const currentLevelXp = xp - totalXpSpent
        const nextLevelXp = requiredForNext
        const progressPercent = Math.max(0, Math.min(100, (currentLevelXp / nextLevelXp) * 100))
        return { level, currentLevelXp, nextLevelXp, progressPercent }
      }
      totalXpSpent += requiredForNext
      level += 1
      if (level > 1000) {
        return { level: 1000, currentLevelXp: 0, nextLevelXp: xpForLevel(1000, base, growth), progressPercent: 0 }
      }
    }
  }

  useEffect(() => {
    async function getProfile() {
      const supabase = createSupabaseClient()

      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select()
        .eq('username', username)
        .single()

      if (error) {
        setLoading(false)
        toast.error("Error retrieving profile")
        console.error(error)
        return 
      }
      console.log("Retrieved profile data", data)
      console.log("Picture URL:", data.picture_url)
      console.log("All profile properties:", Object.keys(data))
      setProfile({
        ...data,
        pictureUrl: data.picture_url,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      })
      setLoading(false)
    }
    getProfile()
  }, [username])

  if (loading)
    return <Loading />

  if (!profile)
    return (
      <main className='p-4'>
        <div className='mb-6'>
          <Button asChild variant="outline">
            <Link href="/profiles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Profiles
            </Link>
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Profile not found.</p>
        </div>
      </main>
    )

  // Compute level and progress from xp (float8 in DB defaults to 0)
  const xp: number = Number((profile as any)?.xp ?? 0)
  const { level, currentLevelXp, nextLevelXp, progressPercent } = calculateLevel(xp)

  return (
    <main className='p-4'>
      <div className='mb-6'>
        <Button asChild variant="outline">
          <Link href="/profiles">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profiles
          </Link>
        </Button>
      </div>
      
      <div className='max-w-2xl mx-auto'>
        <Card>
          <CardHeader className="text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full border-4 border-background shadow-lg overflow-hidden bg-muted flex items-center justify-center">
                {profile.pictureUrl ? (
                  <Image 
                    src={profile.pictureUrl} 
                    alt={profile.username}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log("Image failed to load:", profile.pictureUrl)
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <div>
                <CardTitle className="text-3xl">{profile.displayName}</CardTitle>
                <p className="text-muted-foreground text-lg">@{profile.username}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* XP Level and Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant='outline'>Level {level}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.floor(currentLevelXp)} / {Math.floor(nextLevelXp)} XP
                </div>
              </div>
              <Progress value={progressPercent} />
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium">Username:</span>
              <span>{profile.username}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Member since:</span>
              <Badge variant='outline'>
                {profile.createdAt.getFullYear()}-{String(profile.createdAt.getMonth() + 1).padStart(2, '0')}-{String(profile.createdAt.getDate()).padStart(2, '0')}
              </Badge>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Profile Information</h3>
              <p className="text-muted-foreground">
                This is the profile page for {profile.displayName}. 
                More information and features will be added here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}