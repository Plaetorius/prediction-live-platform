"use client"

import React, { useEffect } from 'react'
import { Web3AuthProvider } from "@web3auth/modal/react"
import { WagmiProvider } from "@web3auth/modal/react/wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { web3AuthContextConfig } from '@/lib/web3auth'
import { config } from '@/lib/wagmi'

const queryClient = new QueryClient()

export default function Web3AuthProviderWrapper({
  children
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Import polyfills only on client side
    import('@/lib/polyfills')
  }, [])

  return (
    <Web3AuthProvider config={web3AuthContextConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </Web3AuthProvider>
  )
}
