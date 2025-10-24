'use client'

import { Bet, Market, MarketWithAmounts } from "@/lib/types"
import { createContext, ReactNode, useCallback, useContext, useEffect, useReducer } from "react"
import { useStream } from "./StreamProvider"
import { useProfile } from "./ProfileProvider"
import { useStreamFollows } from "./StreamFollowsProvider"
import { selectMarketsByUserBets, selectOpenMarkets, selectMarketsByStreamIds } from "@/lib/markets/selectClient"

interface MarketsContextState {
  markets: Map<string, MarketWithAmounts>
  
  loading: boolean,
  error: string | null
}

type MarketsContextAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_MARKET'; payload: MarketWithAmounts }
  | { type: 'UPDATE_MARKET'; payload: { marketId: string, updates: Partial<MarketWithAmounts> } }
  | { type: 'REMOVE_MARKET'; payload: string }
  | { type: 'SET_MARKETS'; payload: MarketWithAmounts[] }

const initialState: MarketsContextState = {
  markets: new Map(),
  
  loading: false,
  error: null
}

function marketsReducer(state: MarketsContextState, action: MarketsContextAction): MarketsContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
  
    case 'ADD_MARKET': {
      const newMarketEntry: [string, MarketWithAmounts] = [
        action.payload.id,
        action.payload,
      ]
      const newMap = new Map([newMarketEntry, ...Array.from(state.markets.entries())])
      return { ...state, markets: newMap }
    }

    case 'UPDATE_MARKET': {
      const { marketId, updates } = action.payload
      const updatedMarkets = new Map(state.markets)
      const existingMarket = updatedMarkets.get(marketId)
      if (existingMarket) {
        updatedMarkets.set(marketId, { ...existingMarket, ...updates })
      }
      return { ...state, markets: updatedMarkets };
    }

    case 'REMOVE_MARKET':
      const filteredMap = new Map(state.markets)
      filteredMap.delete(action.payload)
      return { ...state, markets: filteredMap }

    case 'SET_MARKETS':
      const newMap: Map<string, MarketWithAmounts> = new Map()
      action.payload.forEach((market) => {
        newMap.set(market.id, market)
      })
      return { ...state, markets: newMap }

    default:
      return state
  }
}

interface MarketsContextType {
  markets: Map<string, MarketWithAmounts>
  loading: boolean
  error: string | null

  addMarket: (market: MarketWithAmounts) => void
  updateMarket: (marketId: string, updates: Partial<MarketWithAmounts>) => void
  removeMarket: (marketId: string) => void
  setMarkets: (markets: MarketWithAmounts[]) => void

  // Computed selectors: work on already fetched data
  getStreamMarkets: (streamId: string) => MarketWithAmounts[]
  getUserBetMarkets: () => MarketWithAmounts[]
  getOpenMarkets: () => MarketWithAmounts[]
  getResolvedMarkets: () => MarketWithAmounts[]
  getMarketsByStatus: (status: string) => MarketWithAmounts[]
}

const MarketContext = createContext<MarketsContextType | null>(null)

export function MarketProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(marketsReducer, initialState)
  const stream = useStream()
  const { profile } = useProfile()
  const { follows } = useStreamFollows()

  const addMarket = useCallback((market: Market) => {
    dispatch({ type: 'ADD_MARKET', payload: market })
  }, [])

  const updateMarket = useCallback((marketId: string, updates: Partial<MarketWithAmounts>) => {
    dispatch({ type: 'UPDATE_MARKET', payload: { marketId: marketId, updates: updates }})
  }, [])

  const removeMarket = useCallback((marketId: string) => {
    dispatch({ type: 'REMOVE_MARKET', payload: marketId })
  }, [])

  const setMarkets = useCallback((markets: MarketWithAmounts[]) => {
    dispatch({ type: 'SET_MARKETS', payload: markets })
  }, [])

  useEffect(() => {
    const fetchUserMarkets = async () => {
      if (!profile) return
      
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        dispatch({ type: 'SET_ERROR', payload: null })
        
        // Fetch markets from user bets
        const userBetMarkets = await selectMarketsByUserBets(profile.id)
        
        // Fetch markets from followed streams using stream IDs
        const followedStreamMarkets = follows.length > 0 
          ? await selectMarketsByStreamIds(follows)
          : []
        
        // Fetch open markets for discovery
        const openMarkets = await selectOpenMarkets()
        
        // Combine and deduplicate markets
        const allRelevantMarkets = [
          ...(userBetMarkets || []),
          ...(followedStreamMarkets || []),
          ...(openMarkets || []),
        ]
        
        // Remove duplicates based on market ID
        const uniqueMarkets = allRelevantMarkets.reduce((acc, market) => {
          if (!acc.find(m => m.id === market.id)) {
            acc.push({
              ...market,
              amountA: 0,
              amountB: 0,
            })
          }
          return acc
        }, [] as MarketWithAmounts[])
        
        setMarkets(uniqueMarkets)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
        dispatch({ type: 'SET_ERROR', payload: errorMessage })
        console.error('Error fetching user markets:', error)
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }
    
    fetchUserMarkets()
  }, [profile, follows, setMarkets])

  // Computed selectors
  const getStreamMarkets = useCallback((streamId: string) => {
    return Array.from(state.markets.values())
      .filter(market => market.streamId === streamId)
  }, [state.markets])

  const getUserBetMarkets = useCallback(() => {
    // This would need to be computed based on user bets
    // For now, return empty array - you'll need to implement this logic
    return []
  }, [])

  const getOpenMarkets = useCallback(() => {
    return Array.from(state.markets.values())
      .filter(market => market.status === 'open')
  }, [state.markets])

  const getResolvedMarkets = useCallback(() => {
    return Array.from(state.markets.values())
      .filter(market => market.status === 'resolved')
  }, [state.markets])

  const getMarketsByStatus = useCallback((status: string) => {
    return Array.from(state.markets.values())
      .filter(market => market.status === status)
  }, [state.markets])

  const contextValue: MarketsContextType = {
    markets: state.markets,
    loading: state.loading,
    error: state.error,
    
    addMarket,
    updateMarket,
    removeMarket,
    setMarkets,
    
    getStreamMarkets,
    getUserBetMarkets,
    getOpenMarkets,
    getResolvedMarkets,
    getMarketsByStatus,
  }

  return (
    <MarketContext.Provider value={contextValue}>
      {children}
    </MarketContext.Provider>
  )
}

export function useMarket() {
  const context = useContext(MarketContext)
  if (!context) {
    throw new Error("useMarket must be used within a MarketProvider")
  }
  return context
}