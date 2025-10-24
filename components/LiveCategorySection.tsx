"use client";

import { useState, useEffect } from 'react';
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserIcon } from "lucide-react";
import { getEmbedUrl } from "@/lib/utils";
import { useBatchPlatformStatus } from '@/hooks/usePlatformStatus';
import { Stream } from '@/lib/types';
import Link from "next/link";

interface GameCategory {
  id: string;
  name: string;
  image: string;
  badges: string[];
}

interface LiveCategorySectionProps {
  category: GameCategory;
  streams: Stream[];
}

export default function LiveCategorySection({ category, streams }: LiveCategorySectionProps) {
  const [liveStreams, setLiveStreams] = useState<Array<Stream & { liveStatus: { live: boolean; game: string | null; viewer_count: number | null; title: string | null; started_at: string | null; } }>>([]);
  const [loading, setLoading] = useState(true);

  // Use the platform status hook to get live data
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
    if (statusLoading) return;

    const liveStreamsWithStatus = streams
      .filter(stream => stream !== null)
      .map(stream => ({
        ...stream,
        liveStatus: statuses[stream.id]
      }))
      .filter(stream => stream.liveStatus?.live);

    setLiveStreams(liveStreamsWithStatus);
    setLoading(false);
  }, [statuses, statusLoading, streams]);

  if (loading) {
    return (
      <section className="w-full bg-brand-black-3 flex p-4 gap-4">
        <div className="flex flex-col w-64 flex-shrink-0 gap-2">
          <div className="animate-pulse">
            <div className="h-24 bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-600 rounded mt-2"></div>
            <div className="flex gap-1 mt-2">
              <div className="h-6 bg-gray-600 rounded w-16"></div>
              <div className="h-6 bg-gray-600 rounded w-20"></div>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-600 rounded"></div>
          </div>
        </div>
      </section>
    );
  }

  // Don't render the section if no live streams
  if (liveStreams.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-brand-black-3 flex p-4 gap-4">
      {/* Category info section - fixed width */}
      <div className="flex flex-col w-64 flex-shrink-0 gap-2">
        <Image
          src={category.image}
          height={100}
          width={250}
          alt={category.name}
          className="object-cover rounded"
        />
        <h5 className="font-semibold text-white">
          {category.name}
        </h5>
        <div className="flex flex-row flex-wrap gap-1">
          {category.badges.map((badge, index) => (
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
        <div className="mt-2">
          <Badge variant="outline" className="border-green-500 text-green-400">
            {liveStreams.length} Live
          </Badge>
        </div>
      </div>
      
      {/* Live streams gallery section - takes remaining space */}
      <div className="flex-1 min-w-0">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          {liveStreams.map((stream) => (
            <div
              key={stream.id}
              className="flex-shrink-0 w-96 bg-brand-black-2 rounded-lg p-4 space-y-4"
            >
              {/* Stream header with platform button and viewer count */}
              <div className="flex justify-between items-center">
                <Button 
                  size="sm" 
                  className="bg-brand-pink hover:bg-brand-pink-dark font-medium text-xs"
                  asChild
                >
                  <Link href={`/streams/${stream.platform}/${stream.name}`}>
                    {stream.platform} / {stream.name}
                  </Link>
                </Button>
                <div className="flex items-center text-brand-pink font-semibold text-sm">
                  <UserIcon className="h-3 w-3 mr-1" />
                  {stream.liveStatus.viewer_count?.toLocaleString() || '0'}
                </div>
              </div>

              {/* Stream iframe */}
              <div className="aspect-video w-full bg-black rounded overflow-hidden">
                <iframe
                  src={getEmbedUrl(stream.platform, stream.name)}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allowFullScreen
                  className="w-full h-full"
                  title={`${stream.platform} stream - ${stream.name}`}
                />
              </div>

              {/* Stream info */}
              <div className="space-y-2">
                {stream.liveStatus.title && (
                  <div className="text-sm text-gray-300 truncate">
                    {stream.liveStatus.title}
                  </div>
                )}
                {stream.liveStatus.game && (
                  <div className="text-xs text-brand-pink">
                    Playing: {stream.liveStatus.game}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-green-500 text-green-400 text-xs">
                    LIVE
                  </Badge>
                  {stream.liveStatus.started_at && (
                    <span className="text-xs text-gray-400">
                      Started {new Date(stream.liveStatus.started_at).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
