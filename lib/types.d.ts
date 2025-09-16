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