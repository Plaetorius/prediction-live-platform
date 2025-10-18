/**
 * Example component demonstrating how to use the platform status utilities
 * This shows how easy it is to check stream status with the new reusable functions
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Clock } from 'lucide-react';
import { usePlatformStatus } from '@/hooks/usePlatformStatus';

interface StreamStatusCardProps {
  platform: string;
  streamName: string;
  className?: string;
}

export default function StreamStatusCard({ 
  platform, 
  streamName, 
  className = "" 
}: StreamStatusCardProps) {
  const { status, loading, error, refetch } = usePlatformStatus(
    platform, 
    streamName, 
    { 
      refreshInterval: 30000, // Refresh every 30 seconds
      enabled: true 
    }
  );

  const formatViewerCount = (count: number | null) => {
    if (!count) return 'N/A';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatStartTime = (startedAt: string | null) => {
    if (!startedAt) return 'N/A';
    const startTime = new Date(startedAt);
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m ago`;
    }
    return `${diffMinutes}m ago`;
  };

  return (
    <Card className={`w-80 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {platform} / {streamName}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {error && (
          <Badge variant="destructive" className="w-full justify-center">
            Error: {error}
          </Badge>
        )}
        
        {loading && !status && (
          <Badge variant="outline" className="w-full justify-center">
            Checking status...
          </Badge>
        )}
        
        {status && (
          <>
            <div className="flex items-center gap-2">
              <Badge 
                className={
                  status.live 
                    ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" 
                    : "bg-red-500/15 text-red-500 border-red-500/30"
                }
              >
                {status.live ? 'Live' : 'Offline'}
              </Badge>
              
              {status.live && status.viewer_count && (
                <div className="flex items-center text-sm text-gray-400">
                  <Users className="h-3 w-3 mr-1" />
                  {formatViewerCount(status.viewer_count)}
                </div>
              )}
            </div>
            
            {status.live && status.game && (
              <div className="text-sm">
                <span className="text-gray-400">Playing: </span>
                <span className="text-white font-medium">{status.game}</span>
              </div>
            )}
            
            {status.live && status.title && (
              <div className="text-sm text-gray-300 truncate" title={status.title}>
                {status.title}
              </div>
            )}
            
            {status.live && status.started_at && (
              <div className="flex items-center text-xs text-gray-400">
                <Clock className="h-3 w-3 mr-1" />
                Started {formatStartTime(status.started_at)}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
