"use client";

import { Button } from "@/components/ui/button";
import { UserIcon, Twitch } from "lucide-react";
import { getEmbedUrl } from "@/lib/utils";

interface StreamData {
  id: string;
  platform: string;
  name: string;
  viewers: number;
  title?: string;
}

interface StreamHorizontalGalleryProps {
  streams: StreamData[];
  className?: string;
}

export default function StreamHorizontalGallery({ 
  streams, 
  className = "" 
}: StreamHorizontalGalleryProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {streams.map((stream) => (
          <div
            key={stream.id}
            className="flex-shrink-0 w-80 bg-brand-black-2 rounded-lg p-4 space-y-3"
          >
            {/* Stream header with platform button and viewer count */}
            <div className="flex justify-between items-center">
              <Button 
                size="sm" 
                className="bg-brand-purple hover:bg-brand-purple-dark font-medium text-xs"
              >
                <Twitch strokeWidth={2.5} size={16} className="h-3 w-3 mr-1" />
                {stream.platform} / {stream.name}
              </Button>
              <div className="flex items-center text-brand-pink font-semibold text-sm">
                <UserIcon className="h-3 w-3 mr-1" />
                {stream.viewers.toLocaleString()}
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

            {/* Stream title or additional info */}
            {stream.title && (
              <div className="text-sm text-gray-300 truncate">
                {stream.title}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
