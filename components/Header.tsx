"use client"

import React from 'react'
import { Button } from './ui/button'
import Link from 'next/link'
import { useWeb3AuthConnect } from "@web3auth/modal/react"
import { User, Users, Home, TrendingUp } from 'lucide-react'
import GlassSurface from './GlassSurface'

export default function Header() {
  const { isConnected } = useWeb3AuthConnect()

  return (
    <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm px-4 py-3">
      <nav className="flex items-center gap-2">
        <GlassSurface 
          width={120} 
          height={40}
          borderRadius={12}
          backgroundOpacity={0.1}
          className="hover:scale-105 transition-transform duration-200"
        >
          <Button asChild variant="ghost" className="w-full h-full bg-transparent hover:bg-white/10 text-white border-0">
            <Link href="/" className="flex items-center gap-2 text-sm font-medium tracking-wider uppercase">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </Button>
        </GlassSurface>
        
        <GlassSurface 
          width={120} 
          height={40}
          borderRadius={12}
          backgroundOpacity={0.15}
          className="hover:scale-105 transition-transform duration-200"
        >
          <Button asChild variant="ghost" className="w-full h-full bg-transparent hover:bg-white/10 text-white border-0">
            <Link href="/streams" className="flex items-center gap-2 text-sm font-medium tracking-wider uppercase">
              <TrendingUp className="h-4 w-4" />
              Streams
            </Link>
          </Button>
        </GlassSurface>
        
        {isConnected && (
          <GlassSurface 
            width={140} 
            height={40}
            borderRadius={12}
            backgroundOpacity={0.1}
            className="hover:scale-105 transition-transform duration-200"
          >
            <Button asChild variant="ghost" className="w-full h-full bg-transparent hover:bg-white/10 text-white border-0">
              <Link href="/profile" className="flex items-center gap-2 text-sm font-medium tracking-wider uppercase">
                <User className="h-4 w-4" />
                My Profile
              </Link>
            </Button>
          </GlassSurface>
        )}
        
        <GlassSurface 
          width={140} 
          height={40}
          borderRadius={12}
          backgroundOpacity={0.1}
          className="hover:scale-105 transition-transform duration-200"
        >
          <Button asChild variant="ghost" className="w-full h-full bg-transparent hover:bg-white/10 text-white border-0">
            <Link href="/profiles" className="flex items-center gap-2 text-sm font-medium tracking-wider uppercase">
              <Users className="h-4 w-4" />
              All Profiles
            </Link>
          </Button>
        </GlassSurface>
        
        <GlassSurface 
          width={120} 
          height={40}
          borderRadius={12}
          backgroundOpacity={0.1}
          className="hover:scale-105 transition-transform duration-200"
        >
          <Button asChild variant="ghost" className="w-full h-full bg-transparent hover:bg-white/10 text-white border-0">
            <Link href="/ranking" className="flex items-center gap-2 text-sm font-medium tracking-wider uppercase">
              <TrendingUp className="h-4 w-4" />
              Ranking
            </Link>
          </Button>
        </GlassSurface>
      </nav>
    </header>
  )
}
