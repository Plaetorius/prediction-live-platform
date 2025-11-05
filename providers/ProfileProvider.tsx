"use client"

import { createSupabaseClient } from "@/lib/supabase/client";
import { Bet, Profile } from "@/lib/types";
import { useWeb3AuthConnect, useWeb3AuthUser, useIdentityToken } from "@web3auth/modal/react";
import { createContext, useContext, useState, useEffect, useMemo, useCallback, SetStateAction, Dispatch } from "react";
import { toast } from "sonner";
import { useAccount, useDisconnect, useSignMessage, useBalance, useSwitchChain } from "wagmi";
import { formatBalance } from "@/lib/utils";
import { mapBetSupaToTS } from "@/lib/mappings";

interface ProfileContextType {
  // Regular features
  profile: Profile | null
  loading: boolean
  error: string | null
  isConnected: boolean
  userInfo: any // Web3Auth user info
  balance: string,
  refreshProfile: () => Promise<void>
  refreshBalance: () => Promise<void>
  updateProfile: (update: Partial<Profile>) => Promise<Profile | null>
  clearError: () => void

  confirmedBets: Map<string, Bet> | null
  setConfirmedBets: Dispatch<SetStateAction<Map<string, Bet> | null>>
  refreshConfirmedBets: () => Promise<void>

  // Web3Auth features
  address: string | undefined
  isWalletConnected: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  switchChain: (chainId: number) => Promise<void>
  getBalance: () => Promise<string>
  getCurrentChain: () => { chainId: number | undefined; chainName: string; isSupported: boolean }
  signMessage: (message: string) => Promise<void>
}

interface ProfileProviderProps {
  children: React.ReactNode
}

export const SUPPORTED_CHAINS = {
  SOLANA_MAIN: 101,
  SOLANA_DEV: 103,
  CHILIZ_MAIN: 88888,
  CHILIZ_DEV: 88882,
  BASE_SEPOLIA: 84532,
} as const

type SupportedChain = keyof typeof SUPPORTED_CHAINS

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: ProfileProviderProps) {
  const { userInfo } = useWeb3AuthUser()
  const { isConnected, connect } = useWeb3AuthConnect()
  const { getIdentityToken } = useIdentityToken()
  const { address, isConnected: isWalletConnected, chainId } = useAccount()
  const { disconnect } = useDisconnect()
  const { signMessage } = useSignMessage()
  const { switchChain } = useSwitchChain()

  // the string is the ASSOCIATED MARKET ID not the BET ID
  const [confirmedBets, setConfirmedBets] = useState<Map<string, Bet> | null>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const clearError = () => setError(null)

  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address,
    chainId: SUPPORTED_CHAINS.BASE_SEPOLIA,
    query: {
      enabled: !!address,
      staleTime: 5000, // Reduced from 30s to 5s for faster updates
      refetchInterval: 10000, // Auto-refresh every 10 seconds when connected
    }
  })

  const balance = useMemo(() => {
    return formatBalance(balanceData)
  }, [balanceData?.value, balanceData?.decimals])

  const getBalance = async () => {
    try {
      if (!address) {
        console.error("No address in ProfileProvider")
        return '0.00'
      }
      const result = await refetchBalance()
      console.log("RESULT", result)
      return formatBalance(result.data)
    } catch (error) {
      setError("Failed to fetch balance")
      console.error("Balance fetch error:", error)
      return '0.00'
    }
  }

  const refreshBalance = useCallback(async () => {
    try {
      if (!address) {
        console.log("No address, skipping balance refresh")
        return
      }
      console.log("Refreshing balance...")
      await refetchBalance()
      console.log("Balance refreshed successfully")
    } catch (error) {
      console.error("Error refreshing balance:", error)
    }
  }, [address, refetchBalance])

  const refreshConfirmedBets = async () => {
    if (!profile) {
      setConfirmedBets(null)
      setLoading(false)
      setError(null)
      return
    }
    try {
    setError(null)
    setLoading(true) 

      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('bets')
        .select()
        .eq('status', 'confirmed')
        .eq('profile_id', profile.id)

      if (error) {
        throw new Error(error.message)
      }

      const betsMap = new Map<string, Bet>()
      data.forEach(bet => {
        const formattedBet = mapBetSupaToTS(bet)
        betsMap.set(formattedBet.marketId, formattedBet)
      })
      
      setConfirmedBets(betsMap)
    } catch (error) {
      let errorMessage: string
        
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message)
      } else {
        errorMessage = "An unknown error occurred while fetching bets"
      }
      
      setError(errorMessage)
      console.error("Error fetching bets in Result Provider:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchChain = async (chainId: number) => {
    try {
      const supportedChainIds = Object.values(SUPPORTED_CHAINS)
      if (!supportedChainIds.includes(chainId as any)) {
        throw new Error(`Unsupported chain: ${chainId}`)
      }

      await switchChain({ chainId: chainId as 84532 })

      await refetchBalance()

      if (profile) {
        await updateProfile({
          evmWalletAddress: address,
          currentChainId: chainId,
        })
      }
    } catch (error) {
      setError(`Failed to switch to chain ${chainId}`)
      console.error("Chain switch error:", error)
      throw error
    }
  }

  const getCurrentChain = () => {
    const chainName = Object.keys(SUPPORTED_CHAINS).find(
      key => SUPPORTED_CHAINS[key as SupportedChain] === chainId
    )
    return {
      chainId,
      chainName: chainName || "Unknown",
      isSupported: chainId ? Object.values(SUPPORTED_CHAINS).includes(chainId as any) : false
    }
  }

  const handleConnect = async () => {
    try {
      await connect()
    } catch (error) {
      setError("Failed to connect wallet!")
      console.error("Connection error:", error)
    } 
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      setProfile(null)
      clearError()
    } catch (error) {
      setError("Failed to disconnect wallet")
      console.error("Disconnect error:", error)
    }
  }

  const handleSignMessage = async (message: string) => {
    try {
      return await signMessage({ message })
    } catch (error) {
      setError("Failed to sign message")
      console.error("Sign error:", error)
      throw error
    }
  }

  const refreshProfile = useCallback(async () => {
    // Support both Web3Auth and external wallets (Rabby, MetaMask, etc.)
    const isAnyConnected = isConnected || isWalletConnected
    console.log("ProfileProvider: refreshProfile called, isConnected (Web3Auth):", isConnected, "isWalletConnected (external):", isWalletConnected, "address:", address, "userInfo:", userInfo)
    
    if (!isAnyConnected) {
      setProfile(null)
      setLoading(false)
      clearError()
      return
    }
    
    // For external wallets, we need address but not userInfo
    // For Web3Auth, we need userInfo
    if (!userInfo && !address) {
      console.log("ProfileProvider: Neither userInfo nor address available, waiting...")
      setLoading(true)
      return
    }
    
    try {
      setLoading(true)
      clearError()
      const supabase = createSupabaseClient()

      // Extract web3auth_id using the same logic as sync-user route
      // For Web3Auth: userInfo contains verifierId, userId, email, or name
      // For external wallets: search by address directly
      let web3authId: string | null = null
      
      if (userInfo) {
        const verifierId = (userInfo as any)?.verifierId
        const userId = (userInfo as any)?.userId
        const email = userInfo?.email
        const name = userInfo?.name
        
        web3authId = verifierId || userId || email || name

        console.log("ProfileProvider: Extracted identifiers - verifierId:", verifierId, "userId:", userId, "email:", email, "name:", name)
        console.log("ProfileProvider: Full userInfo object:", JSON.stringify(userInfo, null, 2))
      }

      console.log("ProfileProvider: Looking for user with web3auth_id:", web3authId, "or address:", address)

      let data: any = null
      let fetchError: { code: string } | null = null
      
      // Strategy 1: If we have web3auth_id (Web3Auth), search by that first
      if (web3authId) {
        const normalizedWeb3authId = typeof web3authId === 'string' 
          ? web3authId.trim().toLowerCase() 
          : web3authId
        
        console.log("ProfileProvider: Normalized web3auth_id:", normalizedWeb3authId)
        
        const result = await supabase
          .from('profiles')
          .select()
          .eq('web3auth_id', normalizedWeb3authId)
          .single()

        data = result.data
        fetchError = result.error

        console.log("ProfileProvider: Query by web3auth_id result - data:", data, "error:", fetchError)
        
        // If exact match fails, try case-insensitive search
        if (fetchError && fetchError.code === 'PGRST116') {
          console.log("ProfileProvider: Trying case-insensitive search...")
          const caseInsensitiveResult = await supabase
            .from('profiles')
            .select()
            .ilike('web3auth_id', normalizedWeb3authId)
            .single()
          
          if (caseInsensitiveResult.data) {
            console.log("ProfileProvider: Found profile with case-insensitive search")
            data = caseInsensitiveResult.data
            fetchError = null
          } else {
            console.log("ProfileProvider: Case-insensitive search also failed:", caseInsensitiveResult.error)
            fetchError = caseInsensitiveResult.error
          }
        }
      }

      // Strategy 2: If not found by web3auth_id (or no web3auth_id), and we have a wallet address, search by address
      // This handles both: Web3Auth fallback AND external wallets (Rabby, MetaMask, etc.)
      if ((!data || (fetchError && fetchError.code === 'PGRST116')) && address) {
        console.log("Profile not found by web3auth_id (or no web3auth_id), trying wallet address:", address)
        const normalizedAddress = address.toLowerCase()
        // Try both with and without 0x prefix
        const addressesToTry = [
          normalizedAddress,
          normalizedAddress.startsWith('0x') ? normalizedAddress.slice(2) : `0x${normalizedAddress}`,
        ]
        
        for (const addr of addressesToTry) {
          const walletResult = await supabase
            .from('profiles')
            .select()
            .eq('evm_wallet_address', addr)
            .single()
          
          console.log("ProfileProvider: Wallet query result for", addr, "- data:", walletResult.data, "error:", walletResult.error)
          
          if (walletResult.data) {
            console.log("Found profile by wallet address:", addr)
            data = walletResult.data
            fetchError = null
            break
          }
        }
        
        // If still not found, set fetchError to indicate no profile found
        if (!data) {
          fetchError = { code: 'PGRST116' }
        }
      }

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // Profile not found - try to create it
          console.log("No profile found, attempting to create one...")
          
          // For Web3Auth users, call sync-user API
          if (isConnected && userInfo && web3authId) {
            try {
              const token = await getIdentityToken()
              if (token) {
                console.log("ProfileProvider: Calling sync-user API for Web3Auth user...")
                const syncResponse = await fetch('/api/auth/sync-user', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  }
                })
                
                const syncData = await syncResponse.json()
                
                if (syncData.success) {
                  console.log("ProfileProvider: Profile created via sync-user API, refreshing...")
                  // Retry fetching the profile
                  const retryResult = await supabase
                    .from('profiles')
                    .select()
                    .eq('web3auth_id', web3authId.toLowerCase())
                    .single()
                  
                  if (retryResult.data) {
                    data = retryResult.data
                    fetchError = null
                    if (syncData.isNewUser) {
                      toast.success(`Welcome to Prediction.Live, ${syncData.user.display_name}! 🎉`)
                    }
                  }
                } else {
                  console.error("ProfileProvider: Failed to sync user:", syncData.error)
                  setError("Failed to create profile. Please try again.")
                  setProfile(null)
                  return
                }
              } else {
                console.error("ProfileProvider: No identity token available for sync")
                setError("No profile found. Please sync your account first.")
                setProfile(null)
                return
              }
            } catch (syncError) {
              console.error("ProfileProvider: Error syncing user:", syncError)
              setError("Failed to create profile. Please try again.")
              setProfile(null)
              return
            }
          } 
          // For external wallets, create profile directly
          else if (isWalletConnected && address && !web3authId) {
            try {
              console.log("ProfileProvider: Creating profile for external wallet...")
              
              // Generate username from address
              const username = `wallet_${address.slice(2, 10).toLowerCase()}`
              
              // Ensure username is unique
              let finalUsername = username
              let counter = 1
              while (true) {
                const { data: existingUsername } = await supabase
                  .from('profiles')
                  .select('username')
                  .eq('username', finalUsername)
                  .single()
                
                if (!existingUsername) break
                finalUsername = `${username}_${counter}`
                counter++
              }
              
              const normalizedAddress = address.toLowerCase()
              const insertResult = await supabase
                .from('profiles')
                .insert({
                  web3auth_id: `wallet_${normalizedAddress}`,
                  username: finalUsername,
                  display_name: `Wallet ${address.slice(0, 6)}...${address.slice(-4)}`,
                  email: null,
                  evm_wallet_address: normalizedAddress,
                  web3auth_wallet_address: normalizedAddress,
                  xp: 0,
                  current_chain_id: chainId || SUPPORTED_CHAINS.BASE_SEPOLIA,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .select()
                .single()
              
              if (insertResult.data) {
                console.log("ProfileProvider: Profile created for external wallet")
                data = insertResult.data
                fetchError = null
                toast.success(`Welcome to Prediction.Live! 🎉`)
              } else {
                console.error("ProfileProvider: Failed to create profile:", insertResult.error)
                setError("Failed to create profile. Please try again.")
                setProfile(null)
                return
              }
            } catch (createError) {
              console.error("ProfileProvider: Error creating profile:", createError)
              setError("Failed to create profile. Please try again.")
              setProfile(null)
              return
            }
          } else {
            console.error("No profile found with web3auth_id:", web3authId, "or address:", address)
            setError("No profile found. Please sync your account first.")
            setProfile(null)
            return
          }
        } else {
          setError("Failed to load profile. Please try again.")
          console.error("Error fetching profile:", fetchError)
          setProfile(null)
          return
        }
      }

      if (data) {
        // If we have an address from Wagmi but it's not in the profile, update it
        const profileAddress = data.evm_wallet_address || data.web3auth_wallet_address
        const normalizedProfileAddress = profileAddress ? profileAddress.toLowerCase() : null
        const normalizedCurrentAddress = address ? address.toLowerCase() : null
        
        // If address is available but not in profile, update it
        if (normalizedCurrentAddress && normalizedCurrentAddress !== normalizedProfileAddress) {
          console.log("ProfileProvider: Updating wallet address in profile from", normalizedProfileAddress, "to", normalizedCurrentAddress)
          try {
            const updateResult = await supabase
              .from('profiles')
              .update({
                evm_wallet_address: normalizedCurrentAddress,
                web3auth_wallet_address: normalizedCurrentAddress,
                updated_at: new Date().toISOString()
              })
              .eq('id', data.id)
              .select()
              .single()
            
            if (updateResult.data) {
              data = updateResult.data
              console.log("ProfileProvider: Successfully updated wallet address in profile")
            }
          } catch (updateError) {
            console.error("ProfileProvider: Error updating wallet address:", updateError)
            // Continue with existing data even if update fails
          }
        }
        
        setProfile({
          id: data.id,
          username: data.username,
          displayName: data.display_name,
          pictureUrl: data.picture_url || '',
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          xp: data.xp || 0,
          web3authId: data.web3auth_id || '',
          email: data.email || '',
          web3authWalletAddress: data.web3auth_wallet_address || '',
          evmWalletAddress: data.evm_wallet_address || '',
          currentChainId: data.current_chain_id || 0
        })
        clearError()
      }
    } catch (error) {
      setError("An expected error occured. Please try again.")
      console.error("Error fetching profile:", error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [isConnected, isWalletConnected, userInfo, address])

  const updateProfile = async (update: Partial<Profile>): Promise<Profile | null> => {
    if (!profile) {
      setError("No profile to update")
      return null
    }

    try {
      setLoading(true)
      clearError()
      const supabase = createSupabaseClient()

      const { data: profileData, error: updateError } = await supabase
        .from('profiles')
        .update({
          username: update?.username,
          display_name: update?.displayName,
          picture_url: update?.pictureUrl,
          xp: update?.xp,
          web3auth_id: update?.web3authId,
          email: update?.email,
          web3auth_wallet_address: update?.web3authWalletAddress,
          evm_wallet_address: update?.evmWalletAddress,
          current_chain_id: update?.currentChainId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select()
        .single()

      if (updateError) {
        setError("Failed to update profile. Please try again.")
        console.error("Error updating profile:", updateError)
        return null
      }

      if (profileData) {
        setProfile({
          id: profileData.id,
          username: profileData.username,
          displayName: profileData.display_name,
          pictureUrl: profileData.picture_url || '',
          createdAt: new Date(profileData.created_at),
          updatedAt: new Date(profileData.updated_at),
          xp: profileData.xp || 0,
          web3authId: profileData.web3auth_id || '',
          email: profileData.email || '',
          web3authWalletAddress: profileData.web3auth_wallet_address || '',
          evmWalletAddress: profileData.evm_wallet_address || '',
          currentChainId: profileData.current_chain_id || 0
        })
        clearError()
        toast.success("Profile updated successfully!")
      }

      return profileData
    } catch (e) {
      setError("An unexpected error occured while updating profile.")
      console.error("Error updating profile:", e)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshConfirmedBets()
  }, [profile])

  useEffect(() => {
    // Add a delay to ensure sync process is complete
    // Support both Web3Auth (isConnected + userInfo) and external wallets (isWalletConnected + address)
    const isAnyConnected = isConnected || isWalletConnected
    const hasIdentifier = userInfo || address
    
    if (!isAnyConnected || !hasIdentifier) {
      setProfile(null)
      setLoading(false)
      return
    }

    const timeoutId = setTimeout(() => {
      console.log("ProfileProvider: Triggering refreshProfile after delay")
      refreshProfile()
    }, 2000) // Increased delay to ensure sync completes
    
    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, isWalletConnected, userInfo, address])

  // Additional retry mechanism for new profiles
  useEffect(() => {
    const isAnyConnected = isConnected || isWalletConnected
    const hasIdentifier = userInfo || address
    
    if (isAnyConnected && !profile && !loading && !error && hasIdentifier) {
      // If we're connected but no profile found, retry after a longer delay
      const retryTimeoutId = setTimeout(() => {
        console.log("ProfileProvider: Retrying profile fetch for new wallet...")
        refreshProfile()
      }, 4000) // Increased delay
      
      return () => clearTimeout(retryTimeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, isWalletConnected, profile, loading, error, userInfo, address])



  // Combined connection state: connected via Web3Auth OR external wallet
  const combinedIsConnected = isConnected || isWalletConnected

  const value: ProfileContextType = useMemo(() => ({
    profile,
    loading,
    error,
    isConnected: combinedIsConnected,
    userInfo,
    balance,
    refreshProfile,
    refreshBalance,
    updateProfile,
    clearError,

    confirmedBets,
    setConfirmedBets,
    refreshConfirmedBets,
    
    address,
    isWalletConnected,
    connect: handleConnect,
    disconnect: handleDisconnect,
    switchChain: handleSwitchChain,
    getBalance,
    getCurrentChain,
    signMessage: handleSignMessage,
  }), [
    profile,
    loading,
    combinedIsConnected,
    userInfo,
    address,
    isWalletConnected,
    balance,
    chainId,

    confirmedBets,
    setConfirmedBets,

    refreshProfile,
    refreshBalance,
    updateProfile,
    clearError,
    handleConnect,
    handleDisconnect,
    handleSignMessage,
    handleSwitchChain,
    getBalance,
  ])

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider!')
  }
  return context
}