"use client";

import { useState, useEffect } from 'react';
import { Stream } from '@/lib/types';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useBatchPlatformStatus } from '@/hooks/usePlatformStatus';
import HeroStream from '@/components/HeroStream';
import LiveCategorySection from '@/components/LiveCategorySection';
import Loading from '@/components/Loading';

interface GameCategory {
  id: string;
  name: string;
  image: string;
  badges: string[];
}

export default function Home() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroStream, setHeroStream] = useState<Stream | null>(null);

  const games: GameCategory[] = [
    {
      id: "lol",
      name: "League of Legends",
      image: "/categories/league-of-legends.png",
      badges: ["MOBA", "Strategy", "Competitive"],
    },
    {
      id: "csgo",
      name: "Counter-Strike: Global Offensive",
      image: "/categories/csgo.png",
      badges: ["FPS", "Tactical", "Competitive"],
    },
    {
      id: "valorant",
      name: "VALORANT",
      image: "/categories/valorant.png",
      badges: ["FPS", "Tactical", "5v5"],
    },
    {
      id: "apex",
      name: "Apex Legends",
      image: "/categories/apex-legends.jpg",
      badges: ["BR", "FPS", "Trios"],
    },
    {
      id: "ea-fc-26",
      name: "EA SPORTS FC 26",
      image: "/categories/ea-fc-26.jpg",
      badges: ["Sports", "Football", "Competitive"],
    },
    {
      id: "rocket-league",
      name: "Rocket League",
      image: "/categories/rocket-league.jpg",
      badges: ["Sports", "Cars", "3v3"],
    }
  ];

  // Use the platform status hook to get live data for all streams
  const { statuses, loading: statusLoading } = useBatchPlatformStatus(
    streams.filter(stream => stream !== null).map(stream => ({
      id: stream.id,
      platform: stream.platform,
      name: stream.name
    })),
    { 
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  useEffect(() => {
    async function fetchStreams() {
      const supabase = createSupabaseClient();
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('streams')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching streams:', error);
          return;
        }

        const mappedStreams = data?.map((stream) => ({
          ...stream,
          createdAt: new Date(stream.created_at),
          updatedAt: new Date(stream.updated_at)
        })) || [];

        setStreams(mappedStreams);
      } catch (error) {
        console.error('Error fetching streams:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStreams();
  }, []);

  // Set hero stream (first live stream with highest viewer count)
  useEffect(() => {
    if (statusLoading || !statuses) return;

    const liveStreams = Object.entries(statuses)
      .filter(([, status]) => status.live)
      .map(([streamId, status]) => {
        const stream = streams.find(s => s && s.id === streamId);
        return stream ? { stream, status } : null;
      })
      .filter(Boolean)
      .sort((a, b) => (b?.status.viewer_count || 0) - (a?.status.viewer_count || 0));

    if (liveStreams.length > 0) {
      setHeroStream(liveStreams[0]?.stream || null);
    }
  }, [statuses, statusLoading, streams]);

  // Group streams by category (simplified - you might want to add category mapping)
  const getStreamsForCategory = (categoryId: string): Stream[] => {
    // This is a simplified mapping - you might want to add proper category mapping
    const categoryMappings: Record<string, string[]> = {
      'lol': ['otplol_', 'faker', 'caps', 'doublelift', 'bjergsen'],
      'csgo': ['s1mple', 'shroud', 'flusha', 'olofmeister', 'device'],
      'valorant': ['tenz', 'aspas', 'mixwell'],
      'apex': ['imperialhal', 'nicewigg'],
      'ea-fc-26': ['castro_1021', 'bateson87'],
      'rocket-league': ['garrettg', 'jstn']
    };

    const streamNames = categoryMappings[categoryId] || [];
    return streams.filter(stream => stream && streamNames.includes(stream.name));
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <main className="min-h-screen bg-brand-black-4 p-2 space-y-4">
      {/* Hero Stream Section */}
      {heroStream && statuses[heroStream.id]?.live && (
        <HeroStream 
          stream={heroStream} 
          liveStatus={statuses[heroStream.id]} 
        />
      )}

      {/* Live Category Sections */}
      {games.map((game) => {
        const categoryStreams = getStreamsForCategory(game.id);
        return (
          <LiveCategorySection
            key={game.id}
            category={game}
            streams={categoryStreams}
          />
        );
      })}
    </main>
  );
}