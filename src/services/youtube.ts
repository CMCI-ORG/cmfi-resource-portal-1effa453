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
    // Fetch API key from Supabase
    const { data: secretData, error: secretError } = await supabase
      .from('app_secrets')
      .select('key_value')
      .eq('key_name', 'YOUTUBE_API_KEY')
      .single();

    if (secretError || !secretData) {
      console.error('Error fetching YouTube API key:', secretError);
      return [];
    }

    const apiKey = secretData.key_value;
    
    if (!apiKey) {
      console.error('YouTube API key is not configured');
      return [];
    }
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=date&type=video&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('YouTube API request failed');
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
    return [];
  }
};