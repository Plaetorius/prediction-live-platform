import React from 'react'
import { Toaster } from 'sonner'
import Web3AuthProviderWrapper from './Web3AuthProvider'
import { ProfileProvider } from '@/providers/ProfileProvider'
import { SidebarInset, SidebarProvider } from './ui/sidebar'
import { AppSidebar } from './app-sidebar'
import Web3AuthAutoSync from './Web3AuthAutoSync'

export default function Providers({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Web3AuthProviderWrapper>
        <ProfileProvider>
          <SidebarProvider>
            <AppSidebar variant='sidebar' />
            <SidebarInset>
              {children}
            </SidebarInset>
          </SidebarProvider>
        </ProfileProvider>
        <Web3AuthAutoSync />
      </Web3AuthProviderWrapper>
      <Toaster richColors />
    </>
  )
}
