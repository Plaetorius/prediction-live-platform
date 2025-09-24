"use client"

import { useWeb3AuthSync } from "@/hooks/useWeb3AuthSync"
import { useWeb3AuthConnect } from "@web3auth/modal/react"

export default function Web3AuthAutoSync() {
  // This component automatically syncs users when they connect
  const { isSyncing } = useWeb3AuthSync()
  const { isConnected } = useWeb3AuthConnect()
  
  // Show a subtle loading indicator when syncing
  if (isConnected && isSyncing) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Syncing profile...
        </div>
      </div>
    )
  }
  
  return null
}
