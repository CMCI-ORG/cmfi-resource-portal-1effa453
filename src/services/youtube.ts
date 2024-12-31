import { supabase } from "@/integrations/supabase/client";

interface YouTubeVideo {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      high: { url: string };
    };
    publishedAt: string;
    channelTitle: string;
  };
}

export const fetchYouTubeVideos = async (channelId: string, maxResults = 10) => {
  try {
    // Fetch API key from Supabase with better error handling
    const { data: secretData, error: secretError } = await supabase
      .from('app_secrets')
      .select('key_value')
      .eq('key_name', 'YOUTUBE_API_KEY')
      .maybeSingle();

    if (secretError) {
      console.error('Error fetching YouTube API key:', secretError);
      throw new Error('Failed to fetch YouTube API key');
    }

    if (!secretData) {
      throw new Error('YouTube API key not found. Please add it to app_secrets.');
    }

    const apiKey = secretData.key_value;
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=date&type=video&key=${apiKey}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'YouTube API request failed');
    }

    const data = await response.json();
    return data.items.map((item: YouTubeVideo) => ({
      id: item.id.videoId,
      type: 'video' as const,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high.url,
      date: new Date(item.snippet.publishedAt).toLocaleDateString(),
      source: item.snippet.channelTitle,
    }));
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    throw error;
  }
};