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
  id: string
  username: string
  displayName: string
  pictureUrl: string
  createdAt: Date
  updatedAt: Date
  xp: number
  web3authId: string
  email: string
  walletAddress: string
  currentChainId?: number
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
  onTeamA?: (payload: RealtimePayload) => void;
  onTeamB?: (payload: RealtimePayload) => void;
  onNewMarket?: (payload: RealtimePayload) => void;
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
  startTime: number; // Unix timestamp in milliseconds
  estEndTime: number; // Unix timestamp in milliseconds
  realEndTime: number; // Unix timestamp in milliseconds
  status: typeof Constants.public.Enums.market_status; // Enum: Constants.public.Enums.market_status
  duration: number; // Duration in seconds (as stored in database)
  streamId: string;
  isAnswerA?: boolean | null; // The resolved answer (true for answerA, false for answerB, null if not resolved)
  createdAt: Date;
  updatedAt: Date;
}

export type MarketWithAmounts = Market & {
  amountA?: number;
  amountB?: number;
}

export type Bet = {
  id: string;
  profileId: string;
  marketId: string;
  isAnswerA: boolean;
  createdAt: Date;
  updatedAt: Date;
  amount: number;
  status:  string; // Enum: Constants.public.Enums.bets_status
}

export type BetPayload = {
  marketId: string;
  amount: number;
  profileId: string;
  createdAt: string;
  betId: string;
}

export type BalanceResult = {
  decimals: number;
  formatted: string;
  symbol: string;
  value: bigint;
} | undefined