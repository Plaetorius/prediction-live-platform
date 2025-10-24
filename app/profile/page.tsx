"use client"

import { useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { calculateLevel, getRank } from '@/lib/rankUtils'
import { Gift, User, Trophy, Users, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import Link from 'next/link'
import { useProfile } from '@/providers/ProfileProvider'

export default function PersonalProfile() {
  const [canClaimLootbox, setCanClaimLootbox] = useState(true)
  const [claimingLootbox, setClaimingLootbox] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const {
    profile,
    loading,
    updateProfile,
    isConnected,
    address
  } = useProfile()



  const claimLootbox = async () => {
    if (!profile || claimingLootbox) return

    setClaimingLootbox(true)
    try {
      const supabase = createSupabaseClient()
      
      // Generate random reward type (1/3 each)
      const rewardTypes = ['xp', 'cosmetic', 'void']
      const randomType = rewardTypes[Math.floor(Math.random() * rewardTypes.length)]
      
      const lootboxData: Record<string, unknown> = {
        profile_id: profile.id,
        type: randomType,
        opened_at: new Date().toISOString()
      }

      if (randomType === 'xp') {
        // Give 50-200 XP
        const xpAmount = Math.floor(Math.random() * 151) + 50
        lootboxData.xp_amount = xpAmount
        
        // Update user XP
        await updateProfile({ xp: (profile.xp || 0) + xpAmount })
        toast.success(`🎉 You received ${xpAmount} XP!`)
      } else if (randomType === 'cosmetic') {
        // Generate cosmetic with weighted rarity
        const rarityRoll = Math.random()
        let rarity = 'common'
        if (rarityRoll < 0.03) rarity = 'legendary'
        else if (rarityRoll < 0.10) rarity = 'epic'
        else if (rarityRoll < 0.30) rarity = 'rare'

        const cosmeticId = crypto.randomUUID()
        lootboxData.cosmetic_id = cosmeticId

        // Create cosmetic
        const { error: cosmeticError } = await supabase
          .from('cosmetics')
          .insert({
            id: cosmeticId,
            name: `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} Item`,
            description: `A ${rarity} cosmetic item from your daily lootbox!`,
            rarity: rarity
          })

        if (cosmeticError) {
          console.error('Error creating cosmetic:', cosmeticError)
          return
        }

        toast.success(`🎁 You received a ${rarity} cosmetic!`)
      } else {
        toast.info('💭 The lootbox was empty... Better luck tomorrow!')
      }

      // Create lootbox entry
      const { error: lootboxError } = await supabase
        .from('lootboxes')
        .insert(lootboxData)

      if (lootboxError) {
        console.error('Error creating lootbox:', lootboxError)
        return
      }

      setCanClaimLootbox(false)
    } catch (error) {
      console.error('Error claiming lootbox:', error)
      toast.error('Failed to claim lootbox')
    } finally {
      setClaimingLootbox(false)
    }
  }

  const handlePhotoUpload = async () => {
    if (!profile) return

    setUploadingPhoto(true)
    try {
      const pictureUrl = prompt('Enter the URL for your profile picture:')
      
      if (pictureUrl) {
        await updateProfile({ pictureUrl })
        toast.success('Profile picture updated successfully!')
      }
    } catch (error) {
      console.error('Error updating photo:', error)
      toast.error('Failed to update photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  if (!isConnected) {
    return (
      <main className='p-4'>
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">My Profile</h2>
          <p className="text-gray-400 mb-6">Please connect your wallet to view your profile</p>
          <Link href="/">
            <Button>Go to Homepage</Button>
          </Link>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className='p-4'>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-white mb-2">Loading your profile...</h2>
        </div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className='p-4'>
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Profile not found</h2>
              <p className="text-gray-400 mb-6">Your profile hasn&apos;t been created yet. Please try connecting again.</p>
          <Link href="/">
            <Button>Go to Homepage</Button>
          </Link>
        </div>
      </main>
    )
  }

  const levelData = calculateLevel(profile.xp || 0)
  const level = levelData.level
  const rank = getRank(level)
  const progressPercentage = levelData.progressPercent

  return (
    <main className='p-4'>
      <div className='flex flex-row gap-4 items-center mb-6'>
        <div className="flex items-center gap-2">
          <User className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-white">
            My Profile
          </h2>
        </div>
        <div className="flex gap-2">
          <Link href="/profiles">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              <Users className="mr-2 h-4 w-4" />
              All Profiles
            </Button>
          </Link>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <label className="text-sm text-muted-foreground mb-2 block">Profile Picture</label>
              <div className="relative inline-block">
                {profile.pictureUrl ? (
                  <img
                    src={profile.pictureUrl}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <button
                  onClick={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 cursor-pointer hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              {uploadingPhoto && (
                <p className="text-sm text-muted-foreground mt-2">Updating photo...</p>
              )}
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Display Name</label>
              <p className="font-medium">{profile.displayName}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Username</label>
              <p className="font-medium">@{profile.username}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <p className="font-medium">{profile.email || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Address</label>
              <p className="font-mono text-sm">{address || 'Not connected'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Level & Rank */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Level & Rank
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">Level {level}</div>
              <Badge className={rank.textClass}>
                {rank.name}
              </Badge>
            </div>
            <div>
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>XP Progress</span>
                <span>{levelData.currentLevelXp} / {levelData.nextLevelXp}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Lootbox */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Daily Lootbox
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Claim your daily lootbox for a chance to win XP or cosmetics!
            </p>
            <Button
              onClick={claimLootbox}
              disabled={!canClaimLootbox || claimingLootbox}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Gift className="mr-2 h-4 w-4" />
              {claimingLootbox ? 'Claiming...' : canClaimLootbox ? 'Claim Daily Lootbox' : 'Already Claimed Today'}
            </Button>
            {!canClaimLootbox && (
              <p className="text-sm text-muted-foreground mt-2">
                Come back tomorrow for another chance!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

    </main>
  )
}
