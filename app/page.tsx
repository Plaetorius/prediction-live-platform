"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, Users, LogIn, LogOut, User } from "lucide-react";
import { useWeb3AuthConnect, useWeb3AuthDisconnect, useWeb3AuthUser } from "@web3auth/modal/react";
import { useAccount } from "wagmi";
import Web3AuthAutoSync from "@/components/Web3AuthAutoSync";
import GradientBlinds from "@/components/GradientBlinds";
import GlassSurface from "@/components/GlassSurface";

export default function Home() {
  const { connect, isConnected, connectorName, loading: connectLoading, error: connectError } = useWeb3AuthConnect();
  const { disconnect, loading: disconnectLoading, error: disconnectError } = useWeb3AuthDisconnect();
  const { userInfo } = useWeb3AuthUser();
  const { address } = useAccount();

  return (
    <div className="min-h-screen relative bg-black">
      {/* GradientBlinds Background */}
      <div className="absolute inset-0 w-full h-full">
        <GradientBlinds
          gradientColors={['#FB2B37', '#000000']}
          angle={35}
          noise={0.25}
          blindCount={50}
          blindMinWidth={50}
          spotlightRadius={0.5}
          spotlightSoftness={1}
          spotlightOpacity={1}
          mouseDampening={0.15}
          distortAmount={3}
          shineDirection="left"
          mixBlendMode="lighten"
        />
      </div>
      
      {/* Auto-sync Web3Auth users with Supabase */}
      <Web3AuthAutoSync />
      
      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Brand name with red dot accent */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-wider brand-text">
            PREDICTION<span className="text-red-500">.</span>LIVE
          </h1>
          <p className="text-base md:text-lg text-white tracking-widest uppercase font-semibold brand-tagline">
            DON&apos;T WATCH E-SPORT, PREDICT IT.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white rounded-xl backdrop-blur-sm border border-white/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]">
            <Link href="/streams">
              <Play className="mr-2 h-4 w-4" />
              View Streams
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10 rounded-xl backdrop-blur-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]">
            <Link href="/profiles">
              <Users className="mr-2 h-4 w-4" />
              Browse Profiles
            </Link>
          </Button>
        </div>

        {/* Web3Auth Login/Logout Section with GlassSurface */}
        <div className="w-full max-w-sm">
          <GlassSurface 
            width={400} 
            height={300}
            borderRadius={32}
            backgroundOpacity={0.4}
            saturation={0.8}
            borderWidth={0.02}
            brightness={60}
            opacity={0.95}
            blur={16}
            displace={1.2}
            distortionScale={-120}
            redOffset={5}
            greenOffset={15}
            blueOffset={25}
            mixBlendMode="screen"
            className="p-8"
          >
            {isConnected ? (
              <div className="space-y-6 w-full text-center">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2 brand-text">Welcome back!</h3>
                  <div className="text-white/80 space-y-1">
                    <p className="text-sm">Connected via {connectorName}</p>
                    <p className="text-xs font-mono text-white/60">{address}</p>
                    {userInfo?.name && <p className="text-sm">Hello, {userInfo.name}!</p>}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={() => disconnect()} 
                    variant="outline" 
                    size="sm" 
                    className="w-full h-10 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl backdrop-blur-sm border border-white/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] brand-text"
                    disabled={disconnectLoading}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {disconnectLoading ? 'Disconnecting...' : 'Logout'}
                  </Button>
                  <Button asChild size="sm" className="w-full h-10 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl backdrop-blur-sm border border-white/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] brand-text">
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                  </Button>
                </div>
                {disconnectError && (
                  <p className="text-red-400 text-xs text-center brand-text">{disconnectError.message}</p>
                )}
              </div>
            ) : (
              <div className="space-y-6 w-full text-center">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2 brand-text">Connect with Web3</h3>
                  <p className="text-white/80 text-sm brand-tagline">Sign in with your wallet to access all features</p>
                </div>
                <Button 
                  onClick={() => connect()} 
                  size="sm" 
                  className="w-full h-10 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl backdrop-blur-sm border border-white/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] brand-text relative group overflow-hidden"
                  disabled={connectLoading}
                >
                  <div className="absolute inset-0 rounded-xl">
                    <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-white/50 transition-all duration-500"></div>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                  </div>
                  <span className="relative z-10">
                    {connectLoading ? 'Connecting...' : 'Login / Sign Up'}
                  </span>
                </Button>
                {connectError && (
                  <p className="text-red-400 text-xs text-center brand-text">{connectError.message}</p>
                )}
              </div>
            )}
          </GlassSurface>
        </div>
      </div>
    </div>
  );
}