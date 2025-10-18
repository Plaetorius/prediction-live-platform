import React from 'react'
import { Toaster } from 'sonner'
import Web3AuthProviderWrapper from './Web3AuthProvider'
import { ProfileProvider } from '@/providers/ProfileProvider'
import { SidebarInset, SidebarProvider } from './ui/sidebar'
import { AppSidebar } from './app-sidebar'
import Web3AuthAutoSync from './Web3AuthAutoSync'
import { ResultProvider } from '@/providers/ResultProvider'
import { StreamFollowsProvider } from '@/providers/StreamFollowsProvider'

export default function Providers({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Web3AuthProviderWrapper>
        <ProfileProvider>
          <ResultProvider>
            <StreamFollowsProvider>
              <SidebarProvider>
                <AppSidebar variant='sidebar' />
                  <SidebarInset>
                    {children}
                  </SidebarInset>
                </SidebarProvider>
              </StreamFollowsProvider>
            </ResultProvider>
          </ProfileProvider>
        <Web3AuthAutoSync />
      </Web3AuthProviderWrapper>
      <Toaster richColors />
    </>
  )
}
