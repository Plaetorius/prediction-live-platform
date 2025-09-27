"use client"

import { createSupabaseClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import { useWeb3AuthConnect, useWeb3AuthUser } from "@web3auth/modal/react";
import { createContext, useContext, useReducer, ReactNode, useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useAccount, useDisconnect, useSignMessage, useBalance, type UseBalanceReturnType, useSwitchChain } from "wagmi";
import { formatUnits } from "viem";
import { formatBalance } from "@/lib/utils";

interface ProfileContextType {
  // Regular features
  profile: Profile | null
  loading: boolean
  error: string | null
  isConnected: boolean
  userInfo: any // Web3Auth user info
  balance: string,
  refreshProfile: () => Promise<void>
  updateProfile: (update: Partial<Profile>) => Promise<Profile | null>
  clearError: () => void

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

const SUPPORTED_CHAINS = {
  SOLANA_MAIN: 101,
  SOLANA_DEV: 103,
  CHILIZ_MAIN: 88888,
  CHILIZ_DEV: 88882,
} as const

type SupportedChain = keyof typeof SUPPORTED_CHAINS

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: ProfileProviderProps) {
  const { userInfo } = useWeb3AuthUser()
  const { isConnected, connect } = useWeb3AuthConnect()
  const { address, isConnected: isWalletConnected, chainId } = useAccount()
  const { disconnect } = useDisconnect()
  const { signMessage } = useSignMessage()
  const { switchChain } = useSwitchChain()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const clearError = () => setError(null)

  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address,
    query: {
      enabled: !!address,
      staleTime: 30000,
    }
  })

  const balance = useMemo(() => {
    return formatBalance(balanceData)
  }, [balanceData?.value, balanceData?.decimals])

  const getBalance = async () => {
    try {
      const result = await refetchBalance()
      return formatBalance(result.data)
    } catch (error) {
      setError("Failed to fetch balance")
      console.error("Balance fetch error:", error)
      throw error
    }
  }

  const handleSwitchChain = async (chainId: number) => {
    try {
      const supportedChainIds = Object.values(SUPPORTED_CHAINS)
      if (!supportedChainIds.includes(chainId as any)) {
        throw new Error(`Unsupported chain: ${chainId}`)
      }

      await switchChain({ chainId })

      await refetchBalance()

      if (profile) {
        await updateProfile({
          walletAddress: address,
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

  const refreshProfile = async () => {
    if (!isConnected || !userInfo) {
      setProfile(null)
      setLoading(false)
      clearError()
      return
    }
    
    try {
      setLoading(true)
      clearError()
      const supabase = createSupabaseClient()

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select()
        .eq('web3auth_id', userInfo.email || userInfo.name)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError("No profile found. Please sync your account first.")
          setProfile(null)
        } else {
          setError("Failed to load profile. Please try again.")
          console.error("Error fetching profile:", fetchError)
          setProfile(null)
        }
        return
      }

      if (data) {
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
          walletAddress: data.wallet_address || '',
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
  }

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
          wallet_address: update?.walletAddress,
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
          walletAddress: profileData.wallet_address || '',
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
    refreshProfile()
  }, [isConnected, userInfo])

  const value: ProfileContextType = useMemo(() => ({
    profile,
    loading,
    error,
    isConnected,
    userInfo,
    balance,
    refreshProfile,
    updateProfile,
    clearError,
    
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
    isConnected,
    userInfo,
    address,
    isWalletConnected,
    balance,
    chainId,

    refreshProfile,
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