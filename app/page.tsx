"use client";

import { useWeb3AuthConnect, useWeb3AuthUser } from "@web3auth/modal/react";
import { useAccount } from "wagmi";
import { useProfile } from "@/providers/ProfileProvider";

export default function Home() {
  const { isConnected } = useWeb3AuthConnect();
  const { userInfo } = useWeb3AuthUser();
  const { address } = useAccount();
  const { profile, confirmedBets, loading, error } = useProfile();

  // Combine all profile-related data into a single object
  const profileData = {
    isConnected,
    userInfo,
    address,
    profile,
    confirmedBets: confirmedBets ? Object.fromEntries(confirmedBets) : null,
    loading,
    error
  };

  return (
    <main className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Profile Information</h1>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <pre className="text-green-400 text-sm overflow-auto whitespace-pre-wrap">
            {JSON.stringify(profileData, null, 2)}
          </pre>
        </div>
      </div>
    </main>
  );
}