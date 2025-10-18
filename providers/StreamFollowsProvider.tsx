'use client'

import { createSupabaseClient } from "@/lib/supabase/client"
import { createContext, ReactNode, useCallback, useContext, useEffect, useReducer } from "react"
import { useProfile } from "./ProfileProvider"

interface StreamFollowsState {
  follows: string[]
  loading: boolean
  error: string | null
}

type StreamFollowsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FOLLOWS'; payload: string[] }
  | { type: 'ADD_FOLLOWING'; payload: string } // Pass a streamId
  | { type: 'REMOVE_FOLLOWING'; payload: string } // Pass a streamId


const initialState: StreamFollowsState = {
  follows: [],
  loading: false,
  error: null
}


function streamFollowsReducer(state: StreamFollowsState, action: StreamFollowsAction): StreamFollowsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'SET_FOLLOWS':
      return { ...state, follows: action.payload, loading: false, error: null }

    case 'ADD_FOLLOWING':
      return {
        ...state,
        follows: state.follows.includes(action.payload)
          ? state.follows
          : [...state.follows, action.payload]
      }

    case 'REMOVE_FOLLOWING':
      return {
        ...state,
        follows: state.follows.filter(id => id !== action.payload)
      }

    default:
        return state
    
  }
}

interface StreamFollowsContextType {
  follows: string[]
  loading: boolean
  error: string | null

  fetchFollowing: () => Promise<void>
  addFollowing: (streamId: string) => Promise<void>
  removeFollowing: (steamId: string) => Promise<void>
  clearError: () => void
}

const StreamFollowsContext = createContext<StreamFollowsContextType | null>(null)

export function StreamFollowsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(streamFollowsReducer, initialState)
  const { profile } = useProfile()

  const fetchFollowing = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null})

      const supabase = createSupabaseClient()

      const { data, error } = await supabase
        .from('stream_follows')
        .select('stream_id')
        .eq('profile_id', profile?.id)

      if (error) {
        dispatch({ type: 'SET_ERROR', payload: "Failed to fetch followed streams" })
        console.error('Error fetching following:', error)
        return
      }

      const streamIds = data ? data.map(follow => follow.stream_id) : []
      dispatch({ type: 'SET_FOLLOWS', payload: streamIds })

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'An unexpected error occured' })
      console.error("Error fetching following:", error)
    }
  }, [])

  const addFollowing = useCallback(async (streamId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true})
      dispatch({ type: 'SET_ERROR', payload: null})

      const supabase = createSupabaseClient()

      const { error } = await supabase
        .from('stream_follows')
        .insert({
          profile_id: profile?.id,
          stream_id: streamId
        })
      
      if (error) {
        dispatch({ type: 'SET_ERROR', payload: "Failed to follow stream"})
        console.error("Error adding a new follow stream:", error)
        return
      }

      dispatch({ type: 'ADD_FOLLOWING', payload: streamId})

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: "An unexpected error occured" })
      console.error("Error adding following:", error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const removeFollowing = useCallback(async (streamId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const supabase = createSupabaseClient()

      const { error } = await supabase
        .from('stream_follows')
        .delete()
        .eq('stream_id', streamId)
        .eq('profile_id', profile?.id)

      if (error) {
        dispatch({ type: 'SET_ERROR', payload: "Failed to unfollow stream"})
        console.error('Error removing follow:', error)
        return
      }

      dispatch({ type: 'REMOVE_FOLLOWING', payload: streamId })

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: "An unexpected error occured"})
      console.error("Error removing stream follow:", error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null })
  }, [])

  useEffect(() => {
    if (profile)
      fetchFollowing()
  }, [profile])

  const contextValue: StreamFollowsContextType = {
    follows: state.follows,
    loading: state.loading,
    error: state.error,
    fetchFollowing,
    addFollowing,
    removeFollowing,
    clearError
  }

  return (
    <StreamFollowsContext.Provider value={contextValue}>
      {children}
    </StreamFollowsContext.Provider>
  )
}

export function useStreamFollows() {
  const context = useContext(StreamFollowsContext)
  if (!context) {
    throw new Error("useStreamFollows must be used within a StreamFollowsProvider")
  }
  return context
}