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

  const games = [
    {
      id: "lol",
      name: "League of Legends",
      image: "/categories/league-of-legends.png",
      badges: ["MOBA", "Strategy", "Competitive"],
      streams: [
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
    },
    {
      id: "csgo",
      name: "Counter-Strike: Global Offensive",
      image: "/categories/csgo.png",
      badges: ["FPS", "Tactical", "Competitive"],
      streams: [
        {
          id: "6",
          platform: "twitch",
          name: "s1mple",
          viewers: 25430,
          title: "NAVI - Practice & Analysis"
        },
        {
          id: "7",
          platform: "twitch",
          name: "shroud",
          viewers: 18750,
          title: "CS:GO Ranked Games"
        },
        {
          id: "8",
          platform: "twitch",
          name: "flusha",
          viewers: 12340,
          title: "CS:GO Pro Analysis"
        },
        {
          id: "9",
          platform: "twitch",
          name: "olofmeister",
          viewers: 9870,
          title: "CS:GO Tournament Watch"
        },
        {
          id: "10",
          platform: "twitch",
          name: "device",
          viewers: 15680,
          title: "Astralis - Team Practice"
        }
      ]
    },
    {
      id: "valorant",
      name: "VALORANT",
      image: "/categories/valorant.png",
      badges: ["FPS", "Tactical", "5v5"],
      streams: [
        { id: "11", platform: "twitch", name: "tenz", viewers: 22110, title: "Ranked & Scrims" },
        { id: "12", platform: "twitch", name: "aspas", viewers: 15430, title: "Practice Session" },
        { id: "13", platform: "twitch", name: "mixwell", viewers: 9876, title: "Agent Practice" }
      ]
    },
    {
      id: "apex",
      name: "Apex Legends",
      image: "/categories/apex-legends.jpg",
      badges: ["BR", "FPS", "Trios"],
      streams: [
        { id: "14", platform: "twitch", name: "imperialhal", viewers: 20120, title: "Ranked Grind" },
        { id: "15", platform: "twitch", name: "nicewigg", viewers: 11200, title: "Road to Predator" }
      ]
    },
    {
      id: "ea-fc-26",
      name: "EA SPORTS FC 26",
      image: "/categories/ea-fc-26.jpg",
      badges: ["Sports", "Football", "Competitive"],
      streams: [
        { id: "16", platform: "twitch", name: "castro_1021", viewers: 17200, title: "Ultimate Team" },
        { id: "17", platform: "twitch", name: "bateson87", viewers: 9800, title: "Pack Opening" }
      ]
    },
    {
      id: "rocket-league",
      name: "Rocket League",
      image: "/categories/rocket-league.jpg",
      badges: ["Sports", "Cars", "3v3"],
      streams: [
        { id: "18", platform: "twitch", name: "garrettg", viewers: 8200, title: "Ranked 3v3" },
        { id: "19", platform: "twitch", name: "jstn", viewers: 9400, title: "Mechanics Practice" }
      ]
    }
  ]

  return (
    <main className="min-h-screen bg-brand-black-4 p-2 space-y-4">
      {games.map((game) => (
        <section key={game.id} className="w-full bg-brand-black-3 flex p-4 gap-4">
          {/* Category info section - fixed width */}
          <div className="flex flex-col w-64 flex-shrink-0 gap-2">
            <Image
              src={game.image}
              height={100}
              width={250}
              alt={game.name}
              className="object-cover rounded"
            />
            <h5 className="font-semibold text-white">
              {game.name}
            </h5>
            <div className="flex flex-row flex-wrap gap-1">
              {game.badges.map((badge, index) => (
                <Badge 
                  key={index}
                  className={`${
                    index === 0 ? 'bg-brand-purple' : 
                    index === 1 ? 'bg-brand-pink' : 
                    'bg-blue-600'
                  } text-white`}
                >
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Streams gallery section - takes remaining space */}
          <div className="flex-1 min-w-0">
            <StreamHorizontalGallery streams={game.streams} />
          </div>
        </section>
      ))}
    </main>
  )
}