import React from 'react'
import { Toaster } from 'sonner'
import Web3AuthProviderWrapper from './Web3AuthProvider'
import { ProfileProvider } from '@/contexts/ProfileContext'

export default function Providers({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <Web3AuthProviderWrapper>
      <ProfileProvider>
        {children}
        <Toaster richColors />
      </ProfileProvider>
    </Web3AuthProviderWrapper>
  )
}
