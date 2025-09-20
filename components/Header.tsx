"use client"

import React from 'react'
import { Button } from './ui/button'
import Link from 'next/link'
import { useWeb3AuthConnect } from "@web3auth/modal/react"
import { User, Users } from 'lucide-react'

export default function Header() {
  const { isConnected } = useWeb3AuthConnect()

  return (
    <header className="border-b bg-background px-4 py-3">
      <nav className="flex items-center gap-4">
        <Button asChild variant="default">
          <Link href="/">
            Home
          </Link>
        </Button>
        <Button asChild variant="default">
          <Link href="/streams">
            Streams
          </Link>
        </Button>
        {isConnected && (
          <Button asChild variant="default">
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              My Profile
            </Link>
          </Button>
        )}
        <Button asChild variant="default">
          <Link href="/profiles">
            <Users className="mr-2 h-4 w-4" />
            All Profiles
          </Link>
        </Button>
        <Button asChild variant="default">
          <Link href="/ranking">
            Ranking
          </Link>
        </Button>
      </nav>
    </header>
  )
}
