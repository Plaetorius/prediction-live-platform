"use client"

import { useEffect, useState } from 'react'
import { useWeb3AuthUser, useWeb3AuthConnect, useIdentityToken } from "@web3auth/modal/react"
import { useAccount } from "wagmi"
import { toast } from "sonner"

export function useWeb3AuthSync() {
  const { userInfo } = useWeb3AuthUser()
  const { isConnected } = useWeb3AuthConnect()
  const { address } = useAccount()
  const { getIdentityToken } = useIdentityToken()
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const syncUser = async () => {
      // Only sync if user is connected and we have wallet address
      if (!isConnected || !address) {
        setIsSyncing(false)
        return
      }

      setIsSyncing(true)
      try {
        // Get the identity token
        const token = await getIdentityToken()
        
        if (!token) {
          console.log("No identity token available yet")
          setIsSyncing(false)
          return
        }

        // Sync user with Supabase
        const response = await fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (data.success) {
          // Show welcome message for new users
          if (data.isNewUser) {
            toast.success(`Welcome to Prediction.Live, ${data.user.display_name}! 🎉`)
          }
        } else {
          console.error("Failed to sync user:", data.error)
          toast.error("Failed to sync user profile")
        }
      } catch (error) {
        console.error("Error syncing user:", error)
        // Don't show error toast for automatic sync to avoid spam
      } finally {
        setIsSyncing(false)
      }
    }

    // Add a small delay to ensure all Web3Auth data is ready
    const timeoutId = setTimeout(syncUser, 1000)

    return () => clearTimeout(timeoutId)
  }, [isConnected, address])

  return {
    isSynced: isConnected && address,
    isSyncing
  }
}
