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
  return formatUnits(
    balanceData?.value ? balanceData.value : BigInt(0),
    balanceData?.decimals ? balanceData.decimals : 1,
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