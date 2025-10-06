import { useResultChannel } from "@/hooks/useResultChannel";
import { Bet, ResultListeners } from "@/lib/types";
import { createContext, ReactNode, useCallback, useContext, useEffect } from "react";
import { useProfile } from "./ProfileProvider";
import { createSupabaseClient } from "@/lib/supabase/client";
import { mapBetSupaToTS } from "@/lib/mappings";

interface ResultContextType {
  // bets: Map<string, Bet>
  // loading: boolean
  // error: string | null

  sendResult: (payload: any) => void
}

const ResultContext = createContext<ResultContextType | null>(null)

export function ResultProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile()
  
  const resultListeners: ResultListeners = {
    onResult: useCallback((payload: any) => {
      console.log("onResult", payload)
    }, [])
  }

  useEffect(() => {
    const getBets = async () => {
      if (!profile)
        return null
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('bets')
        .select()
        .eq('profile_id', profile.id)
        .eq('status', 'confirmed')

      const formattedBets = data?.map((bet) => {
        return mapBetSupaToTS(bet)
      })

      return formattedBets
    }
    getBets()
  }, [profile])

  const { sendResult } = useResultChannel(resultListeners)

  const contextValue: ResultContextType = {
    sendResult,

  }

  return (
    <ResultContext.Provider value={contextValue}>
      {children}
    </ResultContext.Provider>
  )
}

export function useResult() {
  const context = useContext(ResultContext)
  if (!context) {
    throw new Error("useResult must be used within a ResultProvider")
  }
  return context
}