import React from 'react'
import { Button } from './ui/button'
import Link from 'next/link'

export default function Header() {
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
        <Button asChild variant="default">
          <Link href="/profiles">
            Profiles
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
