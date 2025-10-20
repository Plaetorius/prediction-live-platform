import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { BalanceResult } from "./types"
import { formatUnits } from "viem"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getShortAddress(address: string | undefined) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'No address'
}

export function formatBalance(balanceData: BalanceResult) {
  if (!balanceData) {
    return '0.00'
  }

  return formatUnits(
    balanceData.value || BigInt(0),
    balanceData.decimals || 18,
  )
}

export function getEmbedUrl(platform: string, streamName: string) {
  // Get hostname safely (only in browser)
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  
  switch (platform.toLowerCase()) {
    case 'twitch':
      return `https://player.twitch.tv/?channel=${streamName}&parent=${hostname}`
    case 'youtube':
      return `https://www.youtube.com/embed/${streamName}`
    case 'kick':
      return `https://player.kick.com/${streamName}`
    default:
      return `https://player.twitch.tv/?channel=${streamName}&parent=${hostname}`
  }
}