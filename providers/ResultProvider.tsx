"use client"

import { useResultChannel } from "@/hooks/useResultChannel";
import { Bet, ResultListeners } from "@/lib/types";
import { createContext, ReactNode, useCallback, useContext, useReducer, useState } from "react";
import { useProfile } from "./ProfileProvider";
import { toast } from "sonner";


type BetResult = Bet & {
  correct: boolean
}

interface ResultContextState {
  result: BetResult | null
  loading: boolean
  error: string | null

}

type ResultContextAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_BET'; payload: BetResult }

const initialState: ResultContextState = {
  result: null,
  loading: false,
  error: null
}

function resultReducer(state: ResultContextState, action: ResultContextAction): ResultContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'SET_BET':
      return { ...state, result: action.payload }

    default:
      return state
  }
}

interface ResultContextType {
  result: BetResult | null
  loading: boolean
  error: string | null

  sendResult: (payload: any) => void
}


const ResultContext = createContext<ResultContextType | null>(null)

export function ResultProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(resultReducer, initialState)
  const { profile, confirmedBets } = useProfile()
  
  // Global result listener that always listens for market resolutions
  const resultListeners: ResultListeners = {
    onResult: useCallback((payload: any) => {
      // payload: marketId, isAnswerA
      console.log("Global result received:", payload)
      
      // Only process results if user is authenticated and has bets
      if (!profile || !confirmedBets) {
        dispatch({ type: 'SET_ERROR', payload: "No profile or bets, skipping result processing" })
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
        dispatch({ type: 'SET_BET', payload: {...bet, correct: true } })
      } else {
        toast.error(`YOU LOST BET ON MARKET ${bet.marketId}`)
        dispatch({ type: 'SET_BET', payload: {...bet, correct: false } })
      }
    }, [profile, confirmedBets])
  }

  // Always establish websocket connection, regardless of authentication status
  const { sendResult } = useResultChannel(resultListeners)

  const contextValue: ResultContextType = {
    result: state.result,
    loading: state.loading,
    error: state.error,
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