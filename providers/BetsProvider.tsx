'use client'

import { Bet } from "@/lib/types"
import { createContext, ReactNode, useCallback, useContext, useEffect, useReducer } from "react"
import { useProfile } from "./ProfileProvider"
import { selectBetsByUser } from "@/lib/bets/selectClient"

interface BetsContextState {
  bets: Map<string, Bet>

  loading: boolean,
  error: string | null
}

type BetsContextAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_BET'; payload: Bet }
  | { type: 'UPDATE_BET'; payload: { betId: string, updates: Partial<Bet> } }
  | { type: 'REMOVE_BET'; payload: string }
  | { type: 'SET_BETS'; payload: Bet[] }

const initialState: BetsContextState = {
  bets: new Map(),

  loading: false,
  error: null
}

function betsReducer(state: BetsContextState, action: BetsContextAction): BetsContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
  
    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'ADD_BET': {
      const newBetEntry: [string, Bet] = [
        action.payload.id,
        action.payload
      ]
      const newMap = new Map([newBetEntry, ...Array.from(state.bets.entries())])
      return { ...state, bets: newMap }
    }

    case 'UPDATE_BET': {
      const { betId, updates } = action.payload
      const updatedBets = new Map(state.bets)
      const existingBet = updatedBets.get(betId)
      if (existingBet) {
        updatedBets.set(betId, { ...existingBet, ...updates })
      }
      return { ...state, bets: updatedBets }
    }

    case 'REMOVE_BET':
      const filteredMap = new Map(state.bets)
      filteredMap.delete(action.payload)
      return { ...state, bets: filteredMap }

    case 'SET_BETS':
      const newMap: Map<string, Bet> = new Map()
      action.payload.forEach((bet) => {
        newMap.set(bet.id, bet)
      })
      return { ...state, bets: newMap}
    
    default:
      return state
  }
}

interface BetsContextType {
  bets: Map<string, Bet>
  loading: boolean
  error: string | null

  addBet: (bet: Bet) => void
  updateBet: (betId: string, updates: Partial<Bet>) => void
  removeBet: (betId: string) => void
  setBets: (bets: Bet[]) => void
  refreshBets: () => Promise<void>

  // Computed selectors: work on already fetched data
  getUserBets: () => Bet[]
  getBetsByMarket: (marketId: string) => Bet[]
  getBetsByStatus: (status: string) => Bet[]
  getActiveBets: () => Bet[]
  getResolvedBets: () => Bet[]
}

const BetsContext = createContext<BetsContextType | null>(null)

export function BetsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(betsReducer, initialState)
  const { profile } = useProfile()

  const addBet = useCallback((bet: Bet) => {
    dispatch({ type: 'ADD_BET', payload: bet })
  }, [])

  const updateBet = useCallback((betId: string, updates: Partial<Bet>) => {
    dispatch({ type: 'UPDATE_BET', payload: { betId, updates }})
  }, [])

  const removeBet = useCallback((betId: string) => {
    dispatch({ type: 'REMOVE_BET', payload: betId })
  }, [])

  const setBets = useCallback((bets: Bet[]) => {
    dispatch({ type: 'SET_BETS', payload: bets })
  }, [])

  const refreshBets = useCallback(async () => {
    if (!profile) return
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      
      // Fetch user's own bets
      const userBets = await selectBetsByUser({ profileId: profile.id })
      
      if (userBets) {
        setBets(userBets)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      console.error('Error fetching user bets:', error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [profile, setBets])

  // Fetch user bets
  useEffect(() => {
    refreshBets()
  }, [refreshBets])

  // Computed selectors
  const getUserBets = useCallback(() => {
    if (!profile) return []
    return Array.from(state.bets.values())
      .filter(bet => bet.profileId === profile.id)
  }, [state.bets, profile])

  const getBetsByMarket = useCallback((marketId: string) => {
    return Array.from(state.bets.values())
      .filter(bet => bet.marketId === marketId)
  }, [state.bets])

  const getBetsByStatus = useCallback((status: string) => {
    return Array.from(state.bets.values())
      .filter(bet => bet.status === status)
  }, [state.bets])

  const getActiveBets = useCallback(() => {
    return Array.from(state.bets.values())
      .filter(bet => bet.status === 'active')
  }, [state.bets])

  const getResolvedBets = useCallback(() => {
    return Array.from(state.bets.values())
      .filter(bet => bet.status === 'resolved')
  }, [state.bets])

  const contextValue: BetsContextType = {
    bets: state.bets,
    loading: state.loading,
    error: state.error,
    
    addBet,
    updateBet,
    removeBet,
    setBets,
    refreshBets,
    
    getUserBets,
    getBetsByMarket,
    getBetsByStatus,
    getActiveBets,
    getResolvedBets,
  }

  return (
    <BetsContext.Provider value={contextValue}>
      {children}
    </BetsContext.Provider>
  )
}

export function useBets() {
  const context = useContext(BetsContext)
  if (!context) {
    throw new Error("useBets must be used within a BetsProvider")
  }
  return context
}