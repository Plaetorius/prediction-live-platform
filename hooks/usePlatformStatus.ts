/**
 * React hook for checking platform status
 * Provides a simple interface for components to check stream status
 */

import { useState, useEffect } from 'react';
import { getPlatformStatus, PlatformStatus, PlatformStatusOptions } from '@/lib/platformStatus';

export interface UsePlatformStatusOptions extends PlatformStatusOptions {
  refreshInterval?: number; // in milliseconds
  enabled?: boolean; // whether to enable automatic refreshing
}

export interface UsePlatformStatusReturn {
  status: PlatformStatus | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to check the status of a single stream
 * @param platform - The platform name (twitch, kick, etc.)
 * @param streamName - The streamer's username/channel name
 * @param options - Configuration options
 * @returns Object with status, loading state, error, and refetch function
 */
export function usePlatformStatus(
  platform: string,
  streamName: string,
  options: UsePlatformStatusOptions = {}
): UsePlatformStatusReturn {
  const [status, setStatus] = useState<PlatformStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { refreshInterval, enabled = true, ...statusOptions } = options;

  const fetchStatus = async () => {
    if (!enabled || !platform || !streamName) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getPlatformStatus(platform, streamName, statusOptions);
      setStatus(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch status';
      setError(errorMessage);
      console.error('Platform status fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [platform, streamName, enabled]);

  // Set up refresh interval if specified
  useEffect(() => {
    if (!refreshInterval || !enabled) return;

    const interval = setInterval(fetchStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, enabled]);

  return {
    status,
    loading,
    error,
    refetch: fetchStatus,
  };
}

/**
 * Hook to check the status of multiple streams
 * @param streams - Array of stream objects with platform and name
 * @param options - Configuration options
 * @returns Object with statuses, loading state, error, and refetch function
 */
export function useBatchPlatformStatus(
  streams: Array<{ id: string; platform: string; name: string }>,
  options: UsePlatformStatusOptions = {}
) {
  const [statuses, setStatuses] = useState<Record<string, PlatformStatus>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  const { refreshInterval, enabled = true, ...statusOptions } = options;

  const fetchStatuses = async (isInitialLoad = false) => {
    if (!enabled || streams.length === 0) return;

    // Only show loading for subsequent fetches, not the initial one
    if (!isInitialLoad) {
      setLoading(true);
    }
    setError(null);

    try {
      const { getBatchPlatformStatus } = await import('@/lib/platformStatus');
      const results = await getBatchPlatformStatus(streams, statusOptions);
      setStatuses(results);
      if (isInitialLoad) {
        setHasInitiallyLoaded(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch statuses';
      setError(errorMessage);
      console.error('Batch platform status fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (enabled && streams.length > 0) {
      fetchStatuses(true); // Mark as initial load
    }
  }, [streams, enabled]);

  // Set up refresh interval if specified
  useEffect(() => {
    if (!refreshInterval || !enabled || !hasInitiallyLoaded) return;

    const interval = setInterval(() => fetchStatuses(false), refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, enabled, hasInitiallyLoaded]);

  return {
    statuses,
    loading,
    error,
    refetch: () => fetchStatuses(false),
  };
}
