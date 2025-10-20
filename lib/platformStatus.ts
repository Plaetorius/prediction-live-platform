/**
 * Platform status checking utilities
 * Provides a unified interface for checking live status across different streaming platforms
 * 
 * @example
 * // Check a single stream status
 * const status = await getPlatformStatus('twitch', 'username');
 * console.log(status.live); // true/false
 * 
 * @example
 * // Check multiple streams at once
 * const streams = [
 *   { id: '1', platform: 'twitch', name: 'user1' },
 *   { id: '2', platform: 'kick', name: 'user2' }
 * ];
 * const statuses = await getBatchPlatformStatus(streams);
 * 
 * @example
 * // Use in React component with hook
 * const { status, loading, error } = usePlatformStatus('twitch', 'username', {
 *   refreshInterval: 30000 // Refresh every 30 seconds
 * });
 */

export interface PlatformStatus {
  live: boolean;
  game: string | null;
  viewer_count: number | null;
  title: string | null;
  started_at: string | null;
}

export interface PlatformStatusOptions {
  twitchClientId?: string;
  twitchToken?: string;
  kickToken?: string;
}

/**
 * Checks the live status of a streamer on any supported platform
 * @param platform - The platform name (twitch, kick, etc.)
 * @param streamName - The streamer's username/channel name
 * @param options - API credentials and configuration
 * @returns Promise<PlatformStatus> - The stream status and metadata
 */
export async function getPlatformStatus(
  platform: string,
  streamName: string,
  options: PlatformStatusOptions = {}
): Promise<PlatformStatus> {
  const normalizedPlatform = platform.toLowerCase();
  
  // Get credentials from options or environment variables
  const twitchClientId = options.twitchClientId || process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
  const twitchToken = options.twitchToken || process.env.NEXT_PUBLIC_TWITCH_TOKEN;
  const kickToken = options.kickToken || process.env.NEXT_PUBLIC_KICK_TOKEN;

  switch (normalizedPlatform) {
    case 'twitch':
      return getTwitchStatus(streamName, twitchClientId, twitchToken);
    case 'kick':
      return getKickStatus(streamName, kickToken);
    default:
      console.warn(`Unsupported platform: ${platform}`);
      return getDefaultOfflineStatus();
  }
}

/**
 * Checks Twitch stream status using the Helix API
 */
async function getTwitchStatus(
  streamName: string,
  clientId?: string,
  token?: string
): Promise<PlatformStatus> {
  if (!clientId || !token) {
    console.warn('Twitch API credentials not provided');
    return getDefaultOfflineStatus();
  }

  try {
    // Check live status
    const res = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(streamName)}`,
      {
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${token}`,
        },
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      throw new Error(`Twitch API error: ${res.status}`);
    }

    const json = await res.json() as { data: TwitchStream[] };
    const liveEntry = json.data?.[0];

    if (liveEntry && liveEntry.type === 'live') {
      let gameName: string | null = null;
      
      // Fetch game information if game_id is available
      if (liveEntry.game_id) {
        try {
          const gameRes = await fetch(
            `https://api.twitch.tv/helix/games?id=${liveEntry.game_id}`,
            {
              headers: {
                'Client-ID': clientId,
                'Authorization': `Bearer ${token}`,
              },
              cache: 'no-store',
            }
          );

          if (gameRes.ok) {
            const gameJson = await gameRes.json() as { data: Array<{ name: string }> };
            gameName = gameJson.data?.[0]?.name || null;
          }
        } catch (error) {
          console.warn('Failed to fetch game info:', error);
        }
      }

      return {
        live: true,
        game: gameName,
        viewer_count: liveEntry.viewer_count || null,
        title: liveEntry.title || null,
        started_at: liveEntry.started_at || null,
      };
    } else {
      return getDefaultOfflineStatus();
    }
  } catch (error) {
    console.error(`Twitch status check failed for ${streamName}:`, error);
    return getDefaultOfflineStatus();
  }
}

/**
 * Checks Kick stream status using the Kick API
 */
async function getKickStatus(
  streamName: string,
  token?: string
): Promise<PlatformStatus> {
  if (!token) {
    console.warn('Kick API token not provided');
    return getDefaultOfflineStatus();
  }

  try {
    // Get user_id from username
    const userRes = await fetch(
      `https://api.kick.com/public/v1/channels?slug=${encodeURIComponent(streamName)}`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        cache: 'no-store',
      }
    );

    if (!userRes.ok) {
      return getDefaultOfflineStatus();
    }

    const userData = await userRes.json();
    const userId = userData.data?.[0]?.broadcaster_user_id;

    if (!userId) {
      return getDefaultOfflineStatus();
    }

    // Check livestream status
    const streamRes = await fetch(
      `https://api.kick.com/public/v1/livestreams?broadcaster_user_id=${userId}`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        cache: 'no-store',
      }
    );

    if (!streamRes.ok) {
      return getDefaultOfflineStatus();
    }

    const streamData = await streamRes.json();
    const livestream = streamData.data?.[0];

    if (livestream) {
      return {
        live: true,
        game: livestream.category?.name || null,
        viewer_count: livestream.viewer_count || null,
        title: livestream.session_title || null,
        started_at: livestream.created_at || null,
      };
    } else {
      return getDefaultOfflineStatus();
    }
  } catch (error) {
    console.error(`Kick status check failed for ${streamName}:`, error);
    return getDefaultOfflineStatus();
  }
}

/**
 * Returns the default offline status
 */
function getDefaultOfflineStatus(): PlatformStatus {
  return {
    live: false,
    game: null,
    viewer_count: null,
    title: null,
    started_at: null,
  };
}

/**
 * Batch check status for multiple streams
 * @param streams - Array of stream objects with platform and name properties
 * @param options - API credentials and configuration
 * @returns Promise<Record<string, PlatformStatus>> - Status results keyed by stream ID
 */
export async function getBatchPlatformStatus(
  streams: Array<{ id: string; platform: string; name: string }>,
  options: PlatformStatusOptions = {}
): Promise<Record<string, PlatformStatus>> {
  const results: Record<string, PlatformStatus> = {};

  await Promise.all(
    streams.map(async (stream) => {
      if (!stream) return;
      
      try {
        results[stream.id] = await getPlatformStatus(
          stream.platform,
          stream.name,
          options
        );
      } catch (error) {
        console.error(`Status check failed for ${stream.platform}/${stream.name}:`, error);
        results[stream.id] = getDefaultOfflineStatus();
      }
    })
  );

  return results;
}

// Type definitions for API responses
interface TwitchStream {
  type: string;
  game_id?: string;
  viewer_count?: number;
  title?: string;
  started_at?: string;
}

interface KickStream {
  category?: {
    name: string;
  };
  viewer_count?: number;
  session_title?: string;
  created_at?: string;
}
