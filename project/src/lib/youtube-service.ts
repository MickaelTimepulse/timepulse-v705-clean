import { supabase } from './supabase';

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnails: {
    high: {
      url: string;
    };
  };
}

interface YouTubeApiResponse {
  items: Array<{
    id: {
      videoId: string;
    };
    snippet: YouTubeVideo;
  }>;
  nextPageToken?: string;
}

export async function getYouTubeApiKey(): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'youtube_api_key')
      .maybeSingle();

    if (error) throw error;
    return data?.value || null;
  } catch (error) {
    console.error('Error fetching YouTube API key:', error);
    return null;
  }
}

export async function saveYouTubeApiKey(apiKey: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({
        key: 'youtube_api_key',
        value: apiKey,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving YouTube API key:', error);
    throw error;
  }
}

export function extractChannelId(channelUrl: string): string | null {
  const patterns = [
    /youtube\.com\/@([^/?]+)/,
    /youtube\.com\/channel\/([^/?]+)/,
    /youtube\.com\/c\/([^/?]+)/,
    /youtube\.com\/user\/([^/?]+)/,
  ];

  for (const pattern of patterns) {
    const match = channelUrl.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function searchChannelByHandle(handle: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      return data.items[0].snippet.channelId || data.items[0].id.channelId;
    }

    return null;
  } catch (error) {
    console.error('Error searching for channel:', error);
    throw error;
  }
}

export async function getChannelVideos(
  channelId: string,
  apiKey: string,
  maxResults: number = 50
): Promise<YouTubeVideo[]> {
  try {
    const videos: YouTubeVideo[] = [];
    let pageToken: string | undefined;

    while (videos.length < maxResults) {
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('channelId', channelId);
      url.searchParams.set('type', 'video');
      url.searchParams.set('order', 'date');
      url.searchParams.set('maxResults', '50');
      url.searchParams.set('key', apiKey);

      if (pageToken) {
        url.searchParams.set('pageToken', pageToken);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`YouTube API error: ${errorData.error?.message || response.status}`);
      }

      const data: YouTubeApiResponse = await response.json();

      if (!data.items || data.items.length === 0) break;

      for (const item of data.items) {
        if (videos.length >= maxResults) break;
        videos.push({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          publishedAt: item.snippet.publishedAt,
          thumbnails: item.snippet.thumbnails,
        });
      }

      pageToken = data.nextPageToken;
      if (!pageToken) break;
    }

    return videos;
  } catch (error) {
    console.error('Error fetching channel videos:', error);
    throw error;
  }
}

export async function importVideoToDatabase(video: YouTubeVideo): Promise<void> {
  try {
    const videoData = {
      title: video.title,
      description: video.description,
      youtube_url: `https://www.youtube.com/watch?v=${video.id}`,
      youtube_id: video.id,
      published_date: video.publishedAt.split('T')[0],
      is_featured: false,
      view_count: 0,
    };

    const { data: existing } = await supabase
      .from('videos')
      .select('id')
      .eq('youtube_id', video.id)
      .maybeSingle();

    if (existing) {
      console.log(`Video ${video.id} already exists, skipping...`);
      return;
    }

    const { error } = await supabase.from('videos').insert([videoData]);

    if (error) throw error;
  } catch (error) {
    console.error('Error importing video:', error);
    throw error;
  }
}

export async function importChannelVideos(
  channelUrl: string,
  apiKey: string,
  maxResults: number = 50,
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; skipped: number; errors: number }> {
  try {
    let channelId: string | null = null;

    const handle = extractChannelId(channelUrl);
    if (!handle) {
      throw new Error('URL de chaîne YouTube invalide');
    }

    if (handle.startsWith('UC')) {
      channelId = handle;
    } else {
      channelId = await searchChannelByHandle(handle, apiKey);
    }

    if (!channelId) {
      throw new Error('Impossible de trouver la chaîne YouTube');
    }

    const videos = await getChannelVideos(channelId, apiKey, maxResults);

    let success = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < videos.length; i++) {
      try {
        const { data: existing } = await supabase
          .from('videos')
          .select('id')
          .eq('youtube_id', videos[i].id)
          .maybeSingle();

        if (existing) {
          skipped++;
        } else {
          await importVideoToDatabase(videos[i]);
          success++;
        }
      } catch (error) {
        console.error(`Error importing video ${videos[i].id}:`, error);
        errors++;
      }

      if (onProgress) {
        onProgress(i + 1, videos.length);
      }
    }

    return { success, skipped, errors };
  } catch (error) {
    console.error('Error importing channel videos:', error);
    throw error;
  }
}
