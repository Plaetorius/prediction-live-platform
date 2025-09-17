import { REALTIME_LISTEN_TYPES } from "@supabase/supabase-js";

export interface RealtimePayload {
  [key: string]: unknown;
  type: `${REALTIME_LISTEN_TYPES.BROADCAST}`;
  event: string;
}

export type Stream = {
  id: string
  platform: string
  name: string
  createdAt: Date
  updatedAt: Date
} | null

export type Profile = {
  id: number
  username: string
  displayName: string
  pictureUrl: string
  createdAt: Date
  updatedAt: Date
} | null

export type RankName = 'Bronze' | 'Silver' | 'Gold' | 'Diamond'

export type Rank = {
  name: RankName
  gradient: string
  icon: React.ReactNode
  iconBg: string
  textClass: string
  borderClass: string
  weight: number
}

export type BetListeners = {
  onTeam1?: (payload: any) => void;
  onTeam2?: (payload: any) => void;
}

export type BetChannelOptions = {
  broadcastSelf?: boolean;
  kind?: 'all' | 'pool' | 'placement' | 'resolution';
}

export type Achievement = {
  id: string
  name: string
  description: string
  icon: string
  category: 'onboarding' | 'volume' | 'precision' | 'momentum' | 'diversity' | 'timing' | 'stream' | 'social' | 'resilience' | 'obsidian'
  requirement: number
  unlocked: boolean
  unlockedAt?: Date
}

export type UserAchievement = {
  id: string
  userId: number
  achievementId: string
  unlockedAt: Date
}

export type Market = {
  id: string;
  question: string;
  answerA: string;
  answerB: string;
  startTime: Date;
  duration: number; // Duration (in secs)
  stream_id: string;
}