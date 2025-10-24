import React from 'react'
import { Toaster } from 'sonner'
import Web3AuthProviderWrapper from './Web3AuthProvider'
import { ProfileProvider } from '@/providers/ProfileProvider'
import { SidebarInset, SidebarProvider } from './ui/sidebar'
import { AppSidebar } from './sidebar/AppSidebar'
import Web3AuthAutoSync from './Web3AuthAutoSync'
import { ResultProvider } from '@/providers/ResultProvider'
import { StreamFollowsProvider } from '@/providers/StreamFollowsProvider'
import { MarketProvider } from '@/providers/MarketsProvider'
import { BetsProvider } from '@/providers/BetsProvider'

export default function Providers({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Web3AuthProviderWrapper>
        <ProfileProvider>
          <StreamFollowsProvider>
            <MarketProvider>
              <BetsProvider>
                <ResultProvider>
                  <SidebarProvider>
                    <AppSidebar variant='sidebar' />
                      <SidebarInset>
                        {children}
                      </SidebarInset>
                  </SidebarProvider>
                </ResultProvider>
              </BetsProvider>
            </MarketProvider>
          </StreamFollowsProvider>
        </ProfileProvider>
        <Web3AuthAutoSync />
      </Web3AuthProviderWrapper>
      <Toaster richColors />
    </>
  )
}
