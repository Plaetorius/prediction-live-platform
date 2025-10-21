"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Profile, Achievement } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Trophy, Star, Users, Zap, Lock, CheckCircle } from 'lucide-react'

// Available achievements definition
const ACHIEVEMENTS: Achievement[] = [
  // Onboarding & Habits
  {
    id: 'first-bet',
    name: 'First Predict',
    description: 'Place your first bet',
    icon: '🎯',
    category: 'onboarding',
    requirement: 1,
    unlocked: false
  },
  {
    id: 'week-1',
    name: 'Week 1',
    description: 'Predict at least once per week for 1 consecutive week',
    icon: '📅',
    category: 'onboarding',
    requirement: 1,
    unlocked: false
  },
  {
    id: 'week-4',
    name: 'Week 4',
    description: 'Predict at least once per week for 4 consecutive weeks',
    icon: '📆',
    category: 'onboarding',
    requirement: 4,
    unlocked: false
  },
  {
    id: 'week-12',
    name: 'Week 12',
    description: 'Predict at least once per week for 12 consecutive weeks',
    icon: '🗓️',
    category: 'onboarding',
    requirement: 12,
    unlocked: false
  },
  {
    id: 'daily-3',
    name: 'Daily Touch 3',
    description: 'Login and bet for 3 consecutive days',
    icon: '🔥',
    category: 'onboarding',
    requirement: 3,
    unlocked: false
  },
  {
    id: 'daily-7',
    name: 'Daily Touch 7',
    description: 'Login and bet for 7 consecutive days',
    icon: '⚡',
    category: 'onboarding',
    requirement: 7,
    unlocked: false
  },
  {
    id: 'daily-30',
    name: 'Daily Touch 30',
    description: 'Login and bet for 30 consecutive days',
    icon: '💪',
    category: 'onboarding',
    requirement: 30,
    unlocked: false
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Place a bet between 00:00 and 05:00 (local time) 5 times',
    icon: '🦉',
    category: 'onboarding',
    requirement: 5,
    unlocked: false
  },

  // Volume & Longevity
  {
    id: 'bets-10',
    name: 'Hot Hand (Bronze)',
    description: 'Reach 10 total bets',
    icon: '🥉',
    category: 'volume',
    requirement: 10,
    unlocked: false
  },
  {
    id: 'bets-50',
    name: 'Hot Hand (Silver)',
    description: 'Reach 50 total bets',
    icon: '🥈',
    category: 'volume',
    requirement: 50,
    unlocked: false
  },
  {
    id: 'bets-200',
    name: 'Hot Hand (Gold)',
    description: 'Reach 200 total bets',
    icon: '🥇',
    category: 'volume',
    requirement: 200,
    unlocked: false
  },
  {
    id: 'bets-1000',
    name: 'Hot Hand (Diamond)',
    description: 'Reach 1,000 total bets',
    icon: '💎',
    category: 'volume',
    requirement: 1000,
    unlocked: false
  },
  {
    id: 'volume-100',
    name: 'Fortune as It Is (Bronze)',
    description: 'Total volume bet: $100',
    icon: '💰',
    category: 'volume',
    requirement: 100,
    unlocked: false
  },
  {
    id: 'volume-1000',
    name: 'Fortune as It Is (Silver)',
    description: 'Total volume bet: $1,000',
    icon: '💸',
    category: 'volume',
    requirement: 1000,
    unlocked: false
  },
  {
    id: 'volume-5000',
    name: 'Fortune as It Is (Gold)',
    description: 'Total volume bet: $5,000',
    icon: '💵',
    category: 'volume',
    requirement: 5000,
    unlocked: false
  },
  {
    id: 'volume-25000',
    name: 'Fortune as It Is (Diamond)',
    description: 'Total volume bet: $25,000',
    icon: '🏦',
    category: 'volume',
    requirement: 25000,
    unlocked: false
  },

  // ROI & Precision
  {
    id: 'roi-5',
    name: 'Good Instinct',
    description: 'ROI ≥ +5% on minimum 20 bets',
    icon: '🎲',
    category: 'precision',
    requirement: 5,
    unlocked: false
  },
  {
    id: 'sniper',
    name: 'Sniper',
    description: '8 wins out of 10 consecutive bets',
    icon: '🎯',
    category: 'precision',
    requirement: 8,
    unlocked: false
  },
  {
    id: 'profit-50',
    name: 'Green Balance (Bronze)',
    description: 'Cumulative profit ≥ $50',
    icon: '💚',
    category: 'precision',
    requirement: 50,
    unlocked: false
  },
  {
    id: 'profit-250',
    name: 'Green Balance (Silver)',
    description: 'Cumulative profit ≥ $250',
    icon: '💚',
    category: 'precision',
    requirement: 250,
    unlocked: false
  },
  {
    id: 'profit-1000',
    name: 'Green Balance (Gold)',
    description: 'Cumulative profit ≥ $1,000',
    icon: '💚',
    category: 'precision',
    requirement: 1000,
    unlocked: false
  },
  {
    id: 'profit-5000',
    name: 'Green Balance (Diamond)',
    description: 'Cumulative profit ≥ $5,000',
    icon: '💚',
    category: 'precision',
    requirement: 5000,
    unlocked: false
  },
  {
    id: 'no-loss-session',
    name: 'No-Loss Session',
    description: '1 session (same stream) with ≥ 5 bets and 0 net loss',
    icon: '🛡️',
    category: 'precision',
    requirement: 1,
    unlocked: false
  },

  // Streaks & Momentum
  {
    id: 'streak-3',
    name: 'Hot Streak 3',
    description: '3 consecutive victories',
    icon: '🔥',
    category: 'momentum',
    requirement: 3,
    unlocked: false
  },
  {
    id: 'streak-5',
    name: 'Hot Streak 5',
    description: '5 consecutive victories',
    icon: '⚡',
    category: 'momentum',
    requirement: 5,
    unlocked: false
  },
  {
    id: 'streak-7',
    name: 'Hot Streak 7',
    description: '7 consecutive victories',
    icon: '💥',
    category: 'momentum',
    requirement: 7,
    unlocked: false
  },
  {
    id: 'icebreaker',
    name: 'Icebreaker',
    description: 'End a streak of 5 defeats with a victory',
    icon: '🧊',
    category: 'momentum',
    requirement: 1,
    unlocked: false
  },
  {
    id: 'clutch-time',
    name: 'Clutch Time',
    description: 'Win a bet placed in the last 30 seconds',
    icon: '⏰',
    category: 'momentum',
    requirement: 1,
    unlocked: false
  },

  // Diversity & Exploration
  {
    id: 'games-3',
    name: 'Esports Globetrotter (Bronze)',
    description: 'Predict on 3 different games',
    icon: '🌍',
    category: 'diversity',
    requirement: 3,
    unlocked: false
  },
  {
    id: 'games-5',
    name: 'Esports Globetrotter (Silver)',
    description: 'Predict on 5 different games',
    icon: '🌎',
    category: 'diversity',
    requirement: 5,
    unlocked: false
  },
  {
    id: 'games-8',
    name: 'Esports Globetrotter (Gold)',
    description: 'Predict on 8 different games',
    icon: '🌏',
    category: 'diversity',
    requirement: 8,
    unlocked: false
  },
  {
    id: 'multi-stream',
    name: 'Multi-Stream',
    description: 'Place winning bets on 5 different streamers',
    icon: '📺',
    category: 'diversity',
    requirement: 5,
    unlocked: false
  },
  {
    id: 'tour-leagues',
    name: 'League Tour',
    description: 'Win at least one bet on 4 distinct major tournaments',
    icon: '🏆',
    category: 'diversity',
    requirement: 4,
    unlocked: false
  },

  // Timing & Game Reading
  {
    id: 'first-blood',
    name: 'First Blood',
    description: 'First winning bet of a stream (chronologically)',
    icon: '🩸',
    category: 'timing',
    requirement: 1,
    unlocked: false
  },
  {
    id: 'momentum-reader',
    name: 'Momentum Reader',
    description: '3 consecutive wins on bets from the same match',
    icon: '📊',
    category: 'timing',
    requirement: 3,
    unlocked: false
  },
  {
    id: 'swing-master',
    name: 'Swing Master',
    description: 'Win 2 opposite bets (A then B) on 2 consecutive live streams',
    icon: '🔄',
    category: 'timing',
    requirement: 2,
    unlocked: false
  },

  // Stream/Creator Specific
  {
    id: 'supporter-10',
    name: 'Loyal Supporter (Bronze)',
    description: '10 bets on the same stream',
    icon: '❤️',
    category: 'stream',
    requirement: 10,
    unlocked: false
  },
  {
    id: 'supporter-25',
    name: 'Loyal Supporter (Silver)',
    description: '25 bets on the same stream',
    icon: '💖',
    category: 'stream',
    requirement: 25,
    unlocked: false
  },
  {
    id: 'supporter-50',
    name: 'Loyal Supporter (Gold)',
    description: '50 bets on the same stream',
    icon: '💕',
    category: 'stream',
    requirement: 50,
    unlocked: false
  },
  {
    id: 'perfect-evening',
    name: 'Perfect Evening',
    description: 'On a specific stream: 5 winning bets, 0 losing',
    icon: '✨',
    category: 'stream',
    requirement: 5,
    unlocked: false
  },

  // Social & Metagame
  {
    id: 'team-player',
    name: 'Team Player',
    description: 'Predict via Twitch overlay at least 10 times',
    icon: '👥',
    category: 'social',
    requirement: 10,
    unlocked: false
  },
  {
    id: 'share-1',
    name: 'Share the Hype (Bronze)',
    description: 'Share 1 winning ticket',
    icon: '📤',
    category: 'social',
    requirement: 1,
    unlocked: false
  },
  {
    id: 'share-5',
    name: 'Share the Hype (Silver)',
    description: 'Share 5 winning tickets',
    icon: '📢',
    category: 'social',
    requirement: 5,
    unlocked: false
  },
  {
    id: 'ambassador-1',
    name: 'Ambassador (Bronze)',
    description: '1 referral making ≥ 1 bet',
    icon: '🎖️',
    category: 'social',
    requirement: 1,
    unlocked: false
  },
  {
    id: 'ambassador-3',
    name: 'Ambassador (Silver)',
    description: '3 referrals making ≥ 1 bet',
    icon: '🏅',
    category: 'social',
    requirement: 3,
    unlocked: false
  },
  {
    id: 'ambassador-5',
    name: 'Ambassador (Gold)',
    description: '5 referrals making ≥ 1 bet',
    icon: '🥇',
    category: 'social',
    requirement: 5,
    unlocked: false
  },
  {
    id: 'community-night',
    name: 'Community Night',
    description: 'Win a bet during a community event',
    icon: '🎉',
    category: 'social',
    requirement: 1,
    unlocked: false
  },

  // Recovery & Resilience
  {
    id: 'comeback-kid',
    name: 'Comeback Kid',
    description: 'Return to net profit after being at −$100 cumulative',
    icon: '🔄',
    category: 'resilience',
    requirement: 1,
    unlocked: false
  },
  {
    id: 'green-week',
    name: 'Green Week',
    description: '7 consecutive days with total profit > 0',
    icon: '💚',
    category: 'resilience',
    requirement: 7,
    unlocked: false
  },

  // Rarities & Secrets (Obsidian)
  {
    id: 'oracle',
    name: 'Oracle',
    description: '10 bets predicted correctly on 3 different streams in ≤ 48h',
    icon: '🔮',
    category: 'obsidian',
    requirement: 10,
    unlocked: false
  },
  {
    id: 'last-second-hero',
    name: 'Last-Second Hero',
    description: '3 clutch wins (≤ 10s remaining) in the same week',
    icon: '⚡',
    category: 'obsidian',
    requirement: 3,
    unlocked: false
  },
  {
    id: 'underdog-god',
    name: 'Underdog God',
    description: '3 consecutive wins with x3 odds',
    icon: '🎲',
    category: 'obsidian',
    requirement: 3,
    unlocked: false
  },
  {
    id: 'perfect-run',
    name: 'Perfect Run',
    description: 'Session of 10 bets, 0 loss, ROI ≥ +30%',
    icon: '💎',
    category: 'obsidian',
    requirement: 10,
    unlocked: false
  }
]

const CATEGORY_ICONS = {
  onboarding: <Trophy className="h-4 w-4" />,
  volume: <Zap className="h-4 w-4" />,
  precision: <Star className="h-4 w-4" />,
  momentum: <Users className="h-4 w-4" />,
  diversity: <Trophy className="h-4 w-4" />,
  timing: <Zap className="h-4 w-4" />,
  stream: <Star className="h-4 w-4" />,
  social: <Users className="h-4 w-4" />,
  resilience: <Trophy className="h-4 w-4" />,
  obsidian: <Star className="h-4 w-4" />
}

const CATEGORY_COLORS = {
  onboarding: 'bg-blue-100 text-blue-800 border-blue-200',
  volume: 'bg-green-100 text-green-800 border-green-200',
  precision: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  momentum: 'bg-red-100 text-red-800 border-red-200',
  diversity: 'bg-purple-100 text-purple-800 border-purple-200',
  timing: 'bg-orange-100 text-orange-800 border-orange-200',
  stream: 'bg-pink-100 text-pink-800 border-pink-200',
  social: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  resilience: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  obsidian: 'bg-gray-100 text-gray-800 border-gray-200'
}

export default function AchievementsPage() {
  const params = useParams()
  const username = params.username as string
  const [profile, setProfile] = useState<Profile>(null)
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createSupabaseClient()
      
      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          return
        }

        setProfile(profileData)

        // All achievements start locked - logic will be implemented later with Supabase data
        const updatedAchievements = ACHIEVEMENTS.map(achievement => ({
          ...achievement,
          unlocked: false
        }))
        
        setAchievements(updatedAchievements)
        
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      fetchProfile()
    }
  }, [username])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile not found</h1>
          <p className="text-gray-600">The profile &quot;{username}&quot; does not exist.</p>
        </div>
      </div>
    )
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const totalCount = achievements.length
  const progressPercentage = (unlockedCount / totalCount) * 100

  const achievementsByCategory = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = []
    }
    acc[achievement.category].push(achievement)
    return acc
  }, {} as Record<string, Achievement[]>)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Achievements - {profile.displayName}
        </h1>
        <p className="text-gray-600 mb-4">
          Discover all the accomplishments of this player
        </p>
        
        {/* Progress Overview */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">
              {unlockedCount} / {totalCount} achievements unlocked
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Achievements by Category */}
      {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
        <div key={category} className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            {CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}
            <h2 className="text-xl font-semibold text-gray-900 capitalize">
              {category === 'onboarding' ? 'Onboarding & Habits' :
               category === 'volume' ? 'Volume & Longevity' :
               category === 'precision' ? 'ROI & Precision' :
               category === 'momentum' ? 'Streaks & Momentum' :
               category === 'diversity' ? 'Diversity & Exploration' :
               category === 'timing' ? 'Timing & Game Reading' :
               category === 'stream' ? 'Stream/Creator Specific' :
               category === 'social' ? 'Social & Metagame' :
               category === 'resilience' ? 'Recovery & Resilience' :
               category === 'obsidian' ? 'Rarities & Secrets (Obsidian)' : category}
            </h2>
            <Badge variant="outline" className={CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]}>
              {categoryAchievements.filter(a => a.unlocked).length} / {categoryAchievements.length}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryAchievements.map((achievement) => (
              <Card 
                key={achievement.id} 
                className={`transition-all duration-200 ${
                  achievement.unlocked 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`text-2xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                      {achievement.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                          {achievement.name}
                        </h3>
                        {achievement.unlocked ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Lock className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <p className={`text-sm ${achievement.unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                        {achievement.description}
                      </p>
                      <div className="mt-2 text-xs">
                        <span className={achievement.unlocked ? 'text-green-600' : 'text-gray-400'}>
                          {achievement.unlocked ? 'Unlocked' : `Requires: ${achievement.requirement}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}