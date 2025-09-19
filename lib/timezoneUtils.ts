/**
 * Timezone utilities for global market platform
 * 
 * Strategy:
 * - Database stores Unix timestamps (milliseconds since 1970)
 * - All calculations use Unix timestamps for consistency
 * - Display functions convert to local time when needed
 * - No timezone ambiguity, just simple integer math
 */

/**
 * Convert Unix timestamp to datetime-local input string
 * @param timestamp Unix timestamp in milliseconds
 * @returns String in format YYYY-MM-DDTHH:mm:ss
 */
export const formatTimestampForInput = (timestamp: number): string => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

/**
 * Parse datetime-local input to Unix timestamp
 * @param inputValue String from datetime-local input
 * @returns Unix timestamp in milliseconds
 */
export const parseInputToTimestamp = (inputValue: string): number => {
  return new Date(inputValue).getTime()
}

/**
 * Get current Unix timestamp
 * @returns Current time as Unix timestamp in milliseconds
 */
export const now = (): number => {
  return Date.now()
}

/**
 * Format a Unix timestamp for display in user's local timezone
 * @param timestamp Unix timestamp in milliseconds
 * @returns Formatted string in user's local timezone
 */
export const formatTimestampForDisplay = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  })
}

/**
 * Calculate time remaining until a target timestamp
 * @param targetTimestamp Unix timestamp in milliseconds
 * @returns Object with time remaining breakdown
 */
export const getTimeRemaining = (targetTimestamp: number): {
  total: number
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
} => {
  const currentTime = now()
  const total = Math.max(0, targetTimestamp - currentTime)
  
  const days = Math.floor(total / (1000 * 60 * 60 * 24))
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((total % (1000 * 60)) / 1000)
  
  return {
    total,
    days,
    hours,
    minutes,
    seconds,
    isExpired: total === 0
  }
}

/**
 * Check if a market is currently active (between start and end timestamps)
 * @param startTimestamp Unix timestamp in milliseconds
 * @param endTimestamp Unix timestamp in milliseconds
 * @returns True if market is currently active
 */
export const isMarketActive = (startTimestamp: number, endTimestamp: number): boolean => {
  const currentTime = now()
  return currentTime >= startTimestamp && currentTime <= endTimestamp
}

/**
 * Add duration to a timestamp
 * @param timestamp Unix timestamp in milliseconds
 * @param durationMs Duration in milliseconds
 * @returns New timestamp
 */
export const addDuration = (timestamp: number, durationMs: number): number => {
  return timestamp + durationMs
}

/**
 * Convert seconds to milliseconds
 * @param seconds Duration in seconds
 * @returns Duration in milliseconds
 */
export const secondsToMs = (seconds: number): number => {
  return seconds * 1000
}

/**
 * Convert minutes to milliseconds
 * @param minutes Duration in minutes
 * @returns Duration in milliseconds
 */
export const minutesToMs = (minutes: number): number => {
  return minutes * 60 * 1000
}
