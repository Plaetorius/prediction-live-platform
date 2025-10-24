"use client"

import React, { useEffect, useState } from 'react'
import { Profile } from '@/lib/types'
import { createSupabaseClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, User, Trophy, Gift } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Loading from '@/components/Loading'
import { toast } from 'sonner'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { calculateLevel, getRank } from '@/lib/rankUtils'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const [loading, setLoading] = useState<boolean>(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [canClaimLootbox, setCanClaimLootbox] = useState<boolean>(false)
  const [claimingLootbox, setClaimingLootbox] = useState<boolean>(false)


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
        updatedAt: new Date(data.updated_at),
        xp: data.xp || 0
      })
      
      // Check if user can claim lootbox today
      await checkLootboxEligibility(data.id)
      setLoading(false)
    }
    getProfile()
  }, [username])

  // Check if user can claim lootbox today
  async function checkLootboxEligibility(profileId: string) {
    const supabase = createSupabaseClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data, error } = await supabase
      .from('lootboxes')
      .select('created_at')
      .eq('profile_id', profileId)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error) {
      console.error('Error checking lootbox eligibility:', error)
      return
    }
    
    // Can claim if no lootbox was claimed today
    setCanClaimLootbox(data.length === 0)
  }

  // Claim daily lootbox
  async function claimLootbox() {
    if (!profile || claimingLootbox) return
    
    setClaimingLootbox(true)
    const supabase = createSupabaseClient()
    
    try {
      // Generate random reward
      const rewardType = Math.random()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lootboxData: any = {
        profile_id: profile.id,
        opened_at: new Date().toISOString()
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let cosmeticData: any = null
      
      if (rewardType < 0.333) {
        // 33.3% chance for XP (50-200 XP)
        lootboxData.type = 'xp'
        lootboxData.xp_amount = Math.floor(Math.random() * 151) + 50
      } else if (rewardType < 0.666) {
        // 33.3% chance for cosmetic
        lootboxData.type = 'cosmetic'
        
        // Create a cosmetic item
        const cosmeticId = crypto.randomUUID()
        const cosmeticRarities = ['common', 'rare', 'epic', 'legendary'] as const
        const randomRarity = cosmeticRarities[Math.floor(Math.random() * cosmeticRarities.length)]
        
        // Create cosmetic data
        cosmeticData = {
          id: cosmeticId,
          name: `Mystery Cosmetic`,
          description: `A rare cosmetic item obtained from a lootbox!`,
          image_url: null, // You can add default cosmetic images later
          rarity: randomRarity
        }
        
        // Insert cosmetic into database
        const { error: cosmeticError } = await supabase
          .from('cosmetics')
          .insert(cosmeticData)
        
        if (cosmeticError) {
          console.error('Error creating cosmetic:', cosmeticError)
          throw new Error('Failed to create cosmetic')
        }
        
        lootboxData.cosmetic_id = cosmeticId
      } else {
        // 33.3% chance for void (nothing)
        lootboxData.type = 'void'
      }
      
      const { error } = await supabase
        .from('lootboxes')
        .insert(lootboxData)
        .select()
        .single()
      
      if (error) {
        throw error
      }
      
      // Update user XP if they got XP reward
      if (lootboxData.type === 'xp' && lootboxData.xp_amount) {
        const { error: xpError } = await supabase
          .from('profiles')
          .update({ 
            xp: (profile.xp || 0) + lootboxData.xp_amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id)
        
        if (xpError) {
          console.error('Error updating XP:', xpError)
        } else {
          // Update local profile state
          setProfile(prev => prev ? {
            ...prev,
            xp: (prev.xp || 0) + lootboxData.xp_amount
          } : null)
        }
      }
      
      setCanClaimLootbox(false)
      
      // Show success message
      if (lootboxData.type === 'xp') {
        toast.success(`🎉 You received ${lootboxData.xp_amount} XP!`)
      } else if (lootboxData.type === 'cosmetic') {
        const rarityEmojis: Record<string, string> = {
          common: '⚪',
          rare: '🔵', 
          epic: '🟣',
          legendary: '🟡'
        }
        const rarity = cosmeticData?.rarity || 'common'
        toast.success(`🎁 You received a ${rarity} cosmetic item! ${rarityEmojis[rarity]}`)
      } else {
        toast.info(`📦 Empty lootbox... Better luck tomorrow!`)
      }
      
    } catch (error) {
      console.error('Error claiming lootbox:', error)
      toast.error('Failed to claim lootbox. Please try again.')
    } finally {
      setClaimingLootbox(false)
    }
  }

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const xp: number = Number((profile as any)?.xp ?? 0)
  const { level, currentLevelXp, nextLevelXp, progressPercent } = calculateLevel(xp)
  const rank = getRank(level)

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
              <div className="relative">
                <div className={`p-[3px] rounded-full bg-gradient-to-tr ${rank.gradient} shadow-lg`}>
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-background flex items-center justify-center">
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
                </div>
                <div className={`absolute -bottom-1 -right-1 ${rank.iconBg} rounded-full p-1 shadow`}
                  aria-label={`Rank ${rank.name}`}>
                  {rank.icon}
                </div>
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
                  <Badge variant='outline' className={`${rank.textClass} ${rank.borderClass}`}>{rank.name}</Badge>
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
              <h3 className="font-semibold mb-4">Actions</h3>
              <div className="space-y-2">
                <Link href={`/profiles/${profile.username}/achievements`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Trophy className="h-4 w-4 mr-2" />
                    View Achievements
                  </Button>
                </Link>
                
                <Button 
                  onClick={claimLootbox}
                  disabled={!canClaimLootbox || claimingLootbox}
                  className={`w-full justify-start ${
                    canClaimLootbox 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white' 
                      : 'opacity-50'
                  }`}
                >
                  <Gift className="h-4 w-4 mr-2" />
                  {claimingLootbox 
                    ? 'Opening...' 
                    : canClaimLootbox 
                      ? 'Claim Daily Lootbox' 
                      : 'Already claimed today'
                  }
                </Button>
              </div>
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