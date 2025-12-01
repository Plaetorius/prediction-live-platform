"use client"

import React, { useEffect, useState } from 'react'
import { useWeb3AuthConnect, useWalletUI } from "@web3auth/modal/react"
import { SidebarTrigger } from './ui/sidebar'
import { Button } from './ui/button'
import { CoinsIcon, Loader2 } from 'lucide-react'
import { useProfile } from '@/providers/ProfileProvider'
import { toast } from 'sonner'

export default function Header() {
  const { isConnected: isWeb3AuthConnected, loading: connectLoading, error: connectError, connectorName } = useWeb3AuthConnect()
  const { profile, isConnected: isProfileConnected, getBalance } = useProfile()
  const { showWalletUI, loading: walletUILoading, error: walletUIError } = useWalletUI()
  const [balance, setBalance] = useState<string | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const isConnected = isWeb3AuthConnected && isProfileConnected
  
  // Debug log for connector name
  useEffect(() => {
    if (connectorName) {
      console.log('Current Web3Auth Connector:', connectorName)
    }
  }, [connectorName])

  // Check if connected via external wallet
  const isExternalWallet = (connectorName as string) === 'injected' || 
                          (connectorName as string) === 'metamask' || 
                          (connectorName as string) === 'wallet-connect' || 
                          (connectorName as string) === 'wallet-connect-v2' || 
                          (connectorName as string) === 'coinbase'
  
  useEffect(() => {
    const getProfileBalance = async () => {
      if (isConnected && profile) {
        setBalanceLoading(true)
        try {
          const balanceResult = await getBalance()
          setBalance(balanceResult)
        } catch (error) {
          console.error("Failed to fetch balance:", error)
          toast.error("Error retrieving balance.")
          setBalance('0.00')
        } finally {
          setBalanceLoading(false)
        }
      } else {
        setBalance(null)
        setBalanceLoading(false)
      }
    }
    getProfileBalance()
  }, [profile, isConnected, getBalance])

  const handleBuyTokens = async () => {
    try {
      await showWalletUI()
    } catch (error) {
      toast.error('Failed to open Wallet Services')
      console.error('Web3Auth Wallet Services error:', error)
    }
  }
  
  return (
    <header className="flex items-center justify-between border-b bg-background px-4 py-3 min-w-0 w-full">
      <SidebarTrigger className='h-8 w-8 flex-shrink-0' />
      <div className="flex-shrink-0">
        {isConnected
        ? (
          <div className='flex items-center gap-2'>
            {balance && !balanceLoading ? (
              <div className='flex flex-row items-center gap-1'>
                <div className='font-semibold whitespace-nowrap'>
                  {parseFloat(balance).toFixed(2)} CHZ
              </div>
              <CoinsIcon className='h-4 w-4 flex-shrink-0' />
              </div>
            ) : balanceLoading ? (
              <div className='font-semibold text-gray-400 whitespace-nowrap'>Loading...</div>
            ): null}
            {!isExternalWallet && (
              <Button 
                onClick={handleBuyTokens}
                disabled={walletUILoading}
                className="whitespace-nowrap"
              >
                {walletUILoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Opening...
                  </>
                ) : (
                  'Wallet'
                )}
              </Button>
            )}
          </div>
        )
        : (
          <></>
        )}
      </div>
    </header>
  )
}
