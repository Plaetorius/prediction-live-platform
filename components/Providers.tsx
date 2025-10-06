import React from 'react'
import { Toaster } from 'sonner'
import Web3AuthProviderWrapper from './Web3AuthProvider'
import { ProfileProvider } from '@/providers/ProfileProvider'
import { ResultProvider } from '@/providers/ResultProvider'

export default function Providers({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <Web3AuthProviderWrapper>
      <ProfileProvider>
        <ResultProvider>
          {children}
          <Toaster richColors />
        </ResultProvider>
      </ProfileProvider>
    </Web3AuthProviderWrapper>
  )
}
