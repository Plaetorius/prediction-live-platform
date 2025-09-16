'use client'

import { Stream } from '@/lib/types'
import { createContext, useContext, useMemo, ReactNode } from 'react'

const StreamCtx = createContext<Stream>(null)

export function StreamProvider(
  { 
    initialStream,
    children
  }: {
    initialStream: Stream,
    children: ReactNode
  }) {
  const value = useMemo(() => initialStream, [initialStream])
  return <StreamCtx.Provider value={value}>{children}</StreamCtx.Provider>
}

export function useStream() {
  return useContext(StreamCtx)
}