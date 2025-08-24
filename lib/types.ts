import { REALTIME_LISTEN_TYPES } from "@supabase/supabase-js";

export interface RealtimePayload {
  [key: string]: any;
  type: `${REALTIME_LISTEN_TYPES.BROADCAST}`;
  event: string;
}