"use client";

import { useWeb3AuthConnect, useWeb3AuthUser } from "@web3auth/modal/react";
import { useAccount } from "wagmi";
import { useProfile } from "@/providers/ProfileProvider";
import { useSolanaAddress } from "@/hooks/useSolanaAddress";

export default function Home() {
  const { isConnected } = useWeb3AuthConnect();
  const { userInfo } = useWeb3AuthUser();
  const { address } = useAccount();
  const { profile, confirmedBets, loading, error } = useProfile();
  const { solanaAddress, isLoading: solanaLoading, error: solanaError, isConnected: solanaConnected } = useSolanaAddress();

  // Combine all profile-related data into a single object
  const profileData = {
    isConnected,
    userInfo,
    address,
    profile,
    confirmedBets: confirmedBets ? Object.fromEntries(confirmedBets) : null,
    loading,
    error,
    // Solana-specific data
    solana: {
      address: solanaAddress,
      isLoading: solanaLoading,
      error: solanaError,
      isConnected: solanaConnected
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Profile Information</h1>
        
        {/* Solana Address Display */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Solana Address</h2>
          {solanaLoading ? (
            <div className="text-yellow-400">Loading Solana address...</div>
          ) : solanaError ? (
            <div className="text-red-400">Error: {solanaError}</div>
          ) : solanaAddress ? (
            <div className="space-y-2">
              <div className="text-green-400 font-mono text-sm break-all bg-gray-700 p-3 rounded">
                {solanaAddress}
              </div>
              <div className="text-sm text-gray-300">
                Status: <span className={solanaConnected ? "text-green-400" : "text-red-400"}>
                  {solanaConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-gray-400">No Solana address found</div>
          )}
        </div>
        
        {/* Full Profile Data */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Full Profile Data</h2>
          <pre className="text-green-400 text-sm overflow-auto whitespace-pre-wrap">
            {JSON.stringify(profileData, null, 2)}
          </pre>
        </div>
      </div>
    </main>
  );
}