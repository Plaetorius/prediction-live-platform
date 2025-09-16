"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Profile } from '@/lib/types'
import { createSupabaseClient } from '@/lib/supabase/client'
import Loading from '@/components/Loading'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { User } from 'lucide-react'
import { calculateLevel, getRank } from '@/lib/rankUtils'


export default function RankingPage() {
  const [loading, setLoading] = useState<boolean>(false)
  const [profiles, setProfiles] = useState<Profile[]>([])

  useEffect(() => {
    async function getProfiles() {
      const supabase = createSupabaseClient()
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select()
      if (error) {
        setLoading(false)
        toast.error('Error retrieving profiles')
        console.error(error)
        return
      }
      setProfiles((data || []).map((p: any) => ({
        ...p,
        pictureUrl: p.picture_url,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at)
      })))
      setLoading(false)
    }
    getProfiles()
  }, [])

  const ranked = useMemo(() => {
    return profiles
      .filter((p): p is NonNullable<Profile> => p !== null)
      .map((p) => {
        const xp = Number((p as any)?.xp ?? 0)
        const { level } = calculateLevel(xp)
        const rank = getRank(level)
        return { profile: p, xp, level, rank }
      })
      .sort((a, b) => {
        if (b.rank.weight !== a.rank.weight) return b.rank.weight - a.rank.weight
        if (b.level !== a.level) return b.level - a.level
        return b.xp - a.xp
      })
  }, [profiles])

  if (loading) return <Loading />

  return (
    <main className="p-4">
      <div className="mb-4">
        <h2>Ranking</h2>
      </div>
      <div className="space-y-3">
        {ranked.map(({ profile, level, xp, rank }, index) => (
          <Card key={profile.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-6 text-right tabular-nums">#{index + 1}</div>
                  <div className="relative">
                    <div className={`p-[2px] rounded-full bg-gradient-to-tr ${rank.gradient} shadow`}>
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-background flex items-center justify-center">
                        {profile.pictureUrl ? (
                          <Image
                            src={profile.pictureUrl}
                            alt={profile.username}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <span className={`absolute -bottom-1 -right-1 ${rank.iconBg} rounded-full p-0.5 shadow`}>{rank.icon}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{profile.displayName}</span>
                    <span className="text-muted-foreground text-sm">@{profile.username}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant='outline'>Lvl {level}</Badge>
                  <Badge variant='outline' className={`${rank.textClass} ${rank.borderClass}`}>{rank.name}</Badge>
                  <Badge variant='outline'>{Math.floor(xp)} XP</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="sr-only">{profile.displayName}</CardTitle>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}

