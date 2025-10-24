"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserIcon, Clock } from "lucide-react";
import { getEmbedUrl } from "@/lib/utils";
import Link from "next/link";
import { Stream } from '@/lib/types';

interface HeroStreamProps {
  stream: Stream | null;
  liveStatus: {
    live: boolean;
    game: string | null;
    viewer_count: number | null;
    title: string | null;
    started_at: string | null;
  };
}

export default function HeroStream({ stream, liveStatus }: HeroStreamProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    if (liveStatus.started_at) {
      const startTime = new Date(liveStatus.started_at);
      const updateTimeAgo = () => {
        const now = new Date();
        const diffMs = now.getTime() - startTime.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffHours > 0) {
          setTimeAgo(`${diffHours}h ${diffMinutes}m ago`);
        } else {
          setTimeAgo(`${diffMinutes}m ago`);
        }
      };
      
      updateTimeAgo();
      const interval = setInterval(updateTimeAgo, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [liveStatus.started_at]);

  if (!liveStatus.live || !stream) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-br from-brand-purple/20 to-brand-pink/20 rounded-2xl p-8 mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stream Video - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl">
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
        </div>

        {/* Stream Info - Takes 1 column on large screens */}
        <div className="space-y-6">
          {/* Stream Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-brand-pink hover:bg-brand-pink-dark text-white font-semibold px-3 py-1">
                {stream.platform.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="border-green-500 text-green-400">
                LIVE
              </Badge>
            </div>

            <h1 className="text-3xl font-bold text-white">
              {stream.name}
            </h1>

            {liveStatus.title && (
              <p className="text-xl text-gray-300 leading-relaxed">
                {liveStatus.title}
              </p>
            )}

            {liveStatus.game && (
              <p className="text-lg text-brand-pink font-medium">
                Playing: {liveStatus.game}
              </p>
            )}
          </div>

          {/* Live Stats */}
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-brand-black-2/50 rounded-lg p-4">
              <div className="flex items-center text-brand-pink">
                <UserIcon className="h-5 w-5 mr-2" />
                <span className="font-semibold">Viewers</span>
              </div>
              <span className="text-2xl font-bold text-white">
                {liveStatus.viewer_count?.toLocaleString() || '0'}
              </span>
            </div>

            {timeAgo && (
              <div className="flex items-center justify-between bg-brand-black-2/50 rounded-lg p-4">
                <div className="flex items-center text-brand-purple">
                  <Clock className="h-5 w-5 mr-2" />
                  <span className="font-semibold">Started</span>
                </div>
                <span className="text-lg font-medium text-white">
                  {timeAgo}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              size="lg" 
              className="w-full bg-brand-pink hover:bg-brand-pink-dark text-white font-semibold"
              asChild
            >
              <Link href={`/streams/${stream.platform}/${stream.name}`}>
                Watch Stream
              </Link>
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white"
              asChild
            >
              <Link href={`/streams/${stream.platform}/${stream.name}`}>
                View Predictions
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
