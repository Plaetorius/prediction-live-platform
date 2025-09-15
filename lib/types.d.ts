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