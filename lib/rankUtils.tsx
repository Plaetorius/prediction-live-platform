"use client"

import React from 'react'
import { Medal, Trophy, Gem } from 'lucide-react'
import { Rank, RankName } from './types'

// Tailwind classes used in this file:
// from-cyan-300 via-sky-400 to-blue-500 text-sky-600 text-sky-700 border-sky-600
// from-yellow-300 via-amber-400 to-orange-500 text-amber-600 text-amber-700 border-amber-600
// from-zinc-200 via-neutral-300 to-stone-400 text-zinc-600 text-zinc-700 border-zinc-500
// from-orange-300 via-amber-500 to-yellow-700 text-orange-700 text-orange-800 border-orange-600
// bg-white h-4 w-4

export function xpForLevel(level: number, base: number = 100, growth: number = 1.2): number {
  if (level <= 1) return base
  return base * Math.pow(growth, level - 1)
}

export function calculateLevel(xp: number, base: number = 100, growth: number = 1.2) {
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

export function getRank(level: number): Rank {
  if (level >= 50) {
    return {
      name: 'Diamond',
      gradient: 'from-cyan-300 via-sky-400 to-blue-500',
      icon: <Gem className="h-4 w-4 text-sky-600" />,
      iconBg: 'bg-white',
      textClass: 'text-sky-700',
      borderClass: 'border-sky-600',
      weight: 4
    }
  }
  if (level >= 20) {
    return {
      name: 'Gold',
      gradient: 'from-yellow-300 via-amber-400 to-orange-500',
      icon: <Trophy className="h-4 w-4 text-amber-600" />,
      iconBg: 'bg-white',
      textClass: 'text-amber-700',
      borderClass: 'border-amber-600',
      weight: 3
    }
  }
  if (level >= 10) {
    return {
      name: 'Silver',
      gradient: 'from-zinc-200 via-neutral-300 to-stone-400',
      icon: <Medal className="h-4 w-4 text-zinc-600" />,
      iconBg: 'bg-white',
      textClass: 'text-zinc-700',
      borderClass: 'border-zinc-500',
      weight: 2
    }
  }
  return {
    name: 'Bronze',
    gradient: 'from-orange-300 via-amber-500 to-yellow-700',
    icon: <Medal className="h-4 w-4 text-orange-700" />,
    iconBg: 'bg-white',
    textClass: 'text-orange-800',
    borderClass: 'border-orange-600',
    weight: 1
  }
}