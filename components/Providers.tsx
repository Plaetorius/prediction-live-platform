import React from 'react'
import { Toaster } from 'sonner'
import Web3AuthProviderWrapper from './Web3AuthProvider'

export default function Providers({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <Web3AuthProviderWrapper>
      {children}
      <Toaster richColors />
    </Web3AuthProviderWrapper>
  )
}
