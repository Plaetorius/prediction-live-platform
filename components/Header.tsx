"use client"

import React from 'react'
import { useWeb3AuthConnect } from "@web3auth/modal/react"
import { SidebarTrigger } from './ui/sidebar'
import { Button } from './ui/button'
import { CoinsIcon, CrownIcon, SearchIcon, UserIcon } from 'lucide-react'

export default function Header() {
  const { connect, isConnected, connectorName, loading: connectLoading, error: connectError } = useWeb3AuthConnect()

  return (
    <header className="flex justify-between items-center border-b bg-background px-4 py-3">
      <SidebarTrigger className='h-8 w-8' />
      <div className='flex gap-2 px-2 py-1 items-center text-brand-pink-dark rounded-xl border-2 border-brand-pink-dark w-[30%]'>
        <SearchIcon width={20} height={20} />
        Search...
      </div>
      <div>
        {isConnected
        ? (
          <Button>
            <CoinsIcon />
            Buy Tokens
          </Button>
        )
        : (
          <></>
        )}
      </div>
    </header>
  )
}
