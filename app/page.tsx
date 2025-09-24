"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, Users, Zap, LogIn, LogOut, User } from "lucide-react";
import { useWeb3AuthConnect, useWeb3AuthDisconnect, useWeb3AuthUser } from "@web3auth/modal/react";
import { useAccount } from "wagmi";
import Web3AuthAutoSync from "@/components/Web3AuthAutoSync";

export default function Home() {
  const { connect, isConnected, connectorName, loading: connectLoading, error: connectError } = useWeb3AuthConnect();
  const { disconnect, loading: disconnectLoading, error: disconnectError } = useWeb3AuthDisconnect();
  const { userInfo } = useWeb3AuthUser();
  const { address } = useAccount();

  return (
    <main className="min-h-screen bg-black">
      {/* Auto-sync Web3Auth users with Supabase */}
      <Web3AuthAutoSync />
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white">
              Prediction.Live
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Real-time prediction platform for gaming streams
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white">
              <Link href="/streams">
                <Play className="mr-2 h-4 w-4" />
                View Streams
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              <Link href="/profiles">
                <Users className="mr-2 h-4 w-4" />
                Browse Profiles
              </Link>
            </Button>
          </div>

          {/* Web3Auth Login/Logout Section */}
          <div className="pt-8 border-t border-gray-800">
            {isConnected ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">Welcome back!</h3>
                  <div className="text-gray-400 space-y-1">
                    <p>Connected via {connectorName}</p>
                    <p className="text-sm font-mono">{address}</p>
                    {userInfo?.name && <p>Hello, {userInfo.name}!</p>}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => disconnect()} 
                    variant="outline" 
                    size="lg" 
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    disabled={disconnectLoading}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {disconnectLoading ? 'Disconnecting...' : 'Logout'}
                  </Button>
                  <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                  </Button>
                </div>
                {disconnectError && (
                  <p className="text-red-400 text-sm text-center">{disconnectError.message}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Connect with Web3</h3>
                <p className="text-gray-400">Sign in with your wallet to access all features</p>
                <Button 
                  onClick={() => connect()} 
                  size="lg" 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  disabled={connectLoading}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {connectLoading ? 'Connecting...' : 'Login / Sign Up'}
                </Button>
                {connectError && (
                  <p className="text-red-400 text-sm text-center">{connectError.message}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

    </main>
  )
}