'use client'

import { BetListeners, BetPayload, Market, MarketWithAmounts, Bet } from "@/lib/types"
import { createContext, ReactNode, useCallback, useContext, useReducer } from "react"
import { useStream } from "./StreamProvider"
import { useBetChannel } from "@/hooks/useBetChannel"
import { useProfile } from "./ProfileProvider"
import { toast } from "sonner"

type BetResult = Bet & {
  correct: boolean
  winnings?: number
  profit?: number
}

interface BettingContextState {
  markets: Map<string, MarketWithAmounts>
  loading: boolean
  error: string | null
  result: BetResult | null
}

type BettingContextAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_MARKET'; payload: Market }
  | { type: 'UPDATE_MARKET_AMOUNTS'; payload: { marketId: string, amountA?: number; amountB?: number } }
  | { type: 'REMOVE_MARKET'; payload: string }
  | { type: 'SET_MARKETS'; payload: Map<string, MarketWithAmounts> }
  | { type: 'SET_BET'; payload: BetResult }

const initialState: BettingContextState = {
  markets: new Map(),
  loading: false,
  error: null,
  result: null
}

function bettingReducer(state: BettingContextState, action: BettingContextAction): BettingContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'ADD_MARKET': {
      const newMarketEntry: [string, MarketWithAmounts] = [
        action.payload.id,
        { ...action.payload, amountA: 0, amountB: 0 }
      ]
      const newMap = new Map([newMarketEntry, ...Array.from(state.markets.entries())])
      return { ...state, markets: newMap }
    }
  
    case 'UPDATE_MARKET_AMOUNTS':
      const updatedMap = new Map(state.markets)
      const market = updatedMap.get(action.payload.marketId)
      if (market) {
        updatedMap.set(action.payload.marketId, {
          ...market,
          amountA: action.payload.amountA ?? market.amountA,
          amountB: action.payload.amountB ?? market.amountB,
        })
      }
      return { ...state, markets: updatedMap }
    
    case 'REMOVE_MARKET':
      const filteredMap = new Map(state.markets)
      filteredMap.delete(action.payload)
      return { ...state, markets: filteredMap }

    case 'SET_MARKETS':
      return { ...state, markets: action.payload }

    case 'SET_BET':
      return { ...state, result: action.payload }

    default:
      return state
  }
}

interface BettingContextType {
  markets: Map<string, MarketWithAmounts>
  loading: boolean
  error: string | null
  result: BetResult | null

  addMarket: (market: Market) => void
  updateMarketAmounts: (marketId: string, amountA?: number, amountB?: number) => void
  removeMarket: (marketId: string) => void
  setMarkets: (markets: Map<string, MarketWithAmounts>) => void

  sendBetTeam1: (payload: BetPayload) => void
  sendBetTeam2: (payload: BetPayload) => void
  sendNewMarket: (payload: any) => void
  sendResult: (payload: any) => void
}

const BettingContext = createContext<BettingContextType | null>(null)

export function BettingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bettingReducer, initialState)
  const stream = useStream()
  const { profile, confirmedBets } = useProfile()

  const betListeners: BetListeners = {
    onTeamA: useCallback((payload: any) => {
      console.log("onTeamA", payload)
      dispatch({
        type: 'UPDATE_MARKET_AMOUNTS',
        payload: {
          marketId: payload.marketId as string,
          amountA: (state.markets.get(payload.marketId as string)?.amountA || 0) + (payload.amount as number)
        }
      })
    }, [state.markets]),

    onTeamB: useCallback((payload: any) => {
      console.log("onTeamB", payload)
      dispatch({
        type: 'UPDATE_MARKET_AMOUNTS',
        payload: {
          marketId: payload.marketId as string,
          amountB: (state.markets.get(payload.marketId as string)?.amountB || 0) + (payload.amount as number)
        }
      })
    }, [state.markets]),

    onNewMarket: useCallback((payload: any) => {
      const newMarket: Market = {
        id: payload.id as string,
        question: payload.question as string,
        answerA: payload.answerA as string, 
        answerB: payload.answerB as string,
        startTime: payload.startTime as number,
        estEndTime: payload.estEndTime as number,
        realEndTime: payload.realEndTime as number,
        status: payload.status as string,
        duration: payload.duration as number,
        streamId: payload.streamId as string,
        createdAt: new Date(payload.createdAt as string),
        updatedAt: new Date(payload.updatedAt as string),
      }
      dispatch({ type: 'ADD_MARKET', payload: newMarket })
    }, []),

    onResult: useCallback((payload: any) => {
      // payload: marketId, isAnswerA
      console.log("Global result received:", payload)
      
      // Remove the market from the list when result is received
      dispatch({ type: 'REMOVE_MARKET', payload: payload.marketId })
      
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

  const { sendBetTeam1, sendBetTeam2, sendNewMarket, sendResult } = useBetChannel(
    stream?.platform || '',
    stream?.name || '',
    betListeners,
    { broadcastSelf: true, kind: 'all' }
  )

  const addMarket = useCallback((market: Market) => {
    dispatch({ type: 'ADD_MARKET', payload: market})
  }, [])

  const updateMarketAmounts = useCallback((marketId: string, amountA?: number, amountB?: number) => {
    dispatch({ type: 'UPDATE_MARKET_AMOUNTS', payload: { marketId, amountA, amountB }})
  }, []) 

  const removeMarket = useCallback((marketId: string) => {
    dispatch({ type: 'REMOVE_MARKET', payload: marketId })
  }, [])

  const setMarkets = useCallback((markets: Map<string, MarketWithAmounts>) => {
    dispatch({ type: 'SET_MARKETS', payload: markets })
  }, [])

  const contextValue: BettingContextType = {
    markets: state.markets,
    loading: state.loading,
    error: state.error,
    result: state.result,
    addMarket,
    updateMarketAmounts,
    removeMarket,
    setMarkets,
    sendBetTeam1,
    sendBetTeam2,
    sendNewMarket,
    sendResult
  }

  return (
    <BettingContext.Provider value={contextValue}>
      {children}
    </BettingContext.Provider>
  )
}

export function useBetting() {
  const context = useContext(BettingContext)
  if (!context) {
    throw new Error("useBetting must be used within a BettingProvider")
  }
  return context
}