"use client"

import { useResultChannel } from "@/hooks/useResultChannel";
import { ResultListeners } from "@/lib/types";
import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { useProfile } from "./ProfileProvider";
import { toast } from "sonner";

interface ResultContextType {
  loading: boolean
  error: string | null
  sendResult: (payload: any) => void
}

const ResultContext = createContext<ResultContextType | null>(null)

export function ResultProvider({ children }: { children: ReactNode }) {
  const { profile, confirmedBets } = useProfile()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  // Global result listener that always listens for market resolutions
  const resultListeners: ResultListeners = {
    onResult: useCallback((payload: any) => {
      // payload: marketId, isAnswerA
      console.log("Global result received:", payload)
      
      // Only process results if user is authenticated and has bets
      if (!profile || !confirmedBets) {
        console.log("No profile or bets, skipping result processing")
        return
      }

      const bet = confirmedBets.get(payload.marketId)
      if (!bet) {
        console.log(`No bet found for market ${payload.marketId}`)
        return
      }
      
      if (bet.isAnswerA === payload.isAnswerA) {
        toast.success(`YOU WON BET ON MARKET ${bet.marketId}`)
      } else {
        toast.error(`YOU LOST BET ON MARKET ${bet.marketId}`)
      }
    }, [profile, confirmedBets])
  }



  // Always establish websocket connection, regardless of authentication status
  const { sendResult } = useResultChannel(resultListeners)

  const contextValue: ResultContextType = {
    loading,
    error,
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