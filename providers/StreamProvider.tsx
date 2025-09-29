'use client'

import { Stream } from '@/lib/types'
import { createContext, useContext, useMemo, ReactNode } from 'react'

const StreamContext = createContext<Stream>(null)

export function StreamProvider(
  { 
    initialStream,
    children
  }: {
    initialStream: Stream,
    children: ReactNode
  }) {
  const value = useMemo(() => initialStream, [initialStream])
  return (
    <StreamContext.Provider value={value}>
      {children}
    </StreamContext.Provider>
  )
}

export function useStream() {
  const context = useContext(StreamContext)
  if (!context) {
    throw new Error('useStream must be used within a StreamProvider')
  }
  return useContext(StreamContext)
}