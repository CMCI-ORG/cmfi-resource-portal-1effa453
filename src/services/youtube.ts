import { supabase } from "@/integrations/supabase/client";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

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
    // First, try to get the API key from Supabase
    const { data: secrets, error } = await supabase
      .from('secrets')
      .select('value')
      .eq('name', 'YOUTUBE_API_KEY')
      .single();

    if (error) {
      console.error('Error fetching YouTube API key:', error);
      return [];
    }

    const apiKey = secrets?.value || YOUTUBE_API_KEY;
    
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