"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Play, Users, LogIn, LogOut, User, UserIcon, Twitch } from "lucide-react";
import { useWeb3AuthConnect, useWeb3AuthDisconnect, useWeb3AuthUser } from "@web3auth/modal/react";
import { useAccount } from "wagmi";
import Web3AuthAutoSync from "@/components/Web3AuthAutoSync";
import GradientBlinds from "@/components/GradientBlinds";
import GlassSurface from "@/components/GlassSurface";
import { getEmbedUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import StreamHorizontalGallery from "@/components/StreamHorizontalGallery";

export default function Home() {
  const { connect, isConnected, connectorName, loading: connectLoading, error: connectError } = useWeb3AuthConnect();
  const { disconnect, loading: disconnectLoading, error: disconnectError } = useWeb3AuthDisconnect();
  const { userInfo } = useWeb3AuthUser();
  const { address } = useAccount();

  const topPlayers = [
    {
      name: "Plaetorius",
      picture_url: "https://avatars.githubusercontent.com/u/46137705?v=4",
      amount: 25367,
    },
    {
      name: "Plaetorius",
      picture_url: "https://avatars.githubusercontent.com/u/46137705?v=4",
      amount: 25367,
    },
    {
      name: "Plaetorius",
      picture_url: "https://avatars.githubusercontent.com/u/46137705?v=4",
      amount: 25367,
    },
    {
      name: "Plaetorius",
      picture_url: "https://avatars.githubusercontent.com/u/46137705?v=4",
      amount: 25367,
    },
    {
      name: "Plaetorius",
      picture_url: "https://avatars.githubusercontent.com/u/46137705?v=4",
      amount: 25367,
    },
    {
      name: "Plaetorius",
      picture_url: "https://avatars.githubusercontent.com/u/46137705?v=4",
      amount: 25367,
    },
    {
      name: "Plaetorius",
      picture_url: "https://avatars.githubusercontent.com/u/46137705?v=4",
      amount: 25367,
    },
    {
      name: "Plaetorius",
      picture_url: "https://avatars.githubusercontent.com/u/46137705?v=4",
      amount: 25367,
    },
    {
      name: "Plaetorius",
      picture_url: "https://avatars.githubusercontent.com/u/46137705?v=4",
      amount: 25367,
    },
    {
      name: "Plaetorius",
      picture_url: "https://avatars.githubusercontent.com/u/46137705?v=4",
      amount: 25367,
    },
  ]

  const sampleStreams = [
    {
      id: "1",
      platform: "twitch",
      name: "otplol_",
      viewers: 15653,
      title: "League of Legends - Ranked Games"
    },
    {
      id: "2", 
      platform: "twitch",
      name: "faker",
      viewers: 45230,
      title: "T1 vs Gen.G - LCK Spring"
    },
    {
      id: "3",
      platform: "twitch", 
      name: "caps",
      viewers: 12890,
      title: "G2 Esports - LEC Practice"
    },
    {
      id: "4",
      platform: "twitch",
      name: "doublelift",
      viewers: 8750,
      title: "100 Thieves - LCS Analysis"
    },
    {
      id: "5",
      platform: "twitch",
      name: "bjergsen",
      viewers: 12340,
      title: "TSM - Team Practice Session"
    }
  ]

  return (
    <main className="min-h-screen bg-brand-black-4 p-2">
      <section className="w-full bg-brand-black-3 grid grid-cols-4 p-4 gap-4">
        {/* Category info section - col-span-1 */}
        <div className="flex flex-col h-full gap-2">
          <Image
            src="/categories/league-of-legends.png"
            height={100}
            width={250}
            alt="League Of Legends"
          />
          <h5 className="font-semibold text-white">
            League Of Legends
          </h5>
          <div className="flex flex-row flex-wrap gap-1">
            <Badge className="bg-brand-purple text-white">
              MOBA
            </Badge>
            <Badge className="bg-brand-pink text-white">
              Strategy
            </Badge>
            <Badge className="bg-blue-600 text-white">
              Competitive
            </Badge>
          </div>
        </div>
        
        {/* Streams gallery section - col-span-3 */}
        <div className="col-span-3">
          <StreamHorizontalGallery streams={sampleStreams} />
        </div>
      </section>
    </main>
  )
}