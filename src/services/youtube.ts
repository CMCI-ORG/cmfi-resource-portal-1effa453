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
    console.log('Fetching videos for channel:', channelId);
    
    // Fetch API key from Supabase
    const { data: secretData, error: secretError } = await supabase
      .from('app_secrets')
      .select('key_value')
      .eq('key_name', 'YOUTUBE_API_KEY')
      .maybeSingle();

    if (secretError) {
      console.error('Error fetching YouTube API key:', secretError);
      throw new Error('Failed to fetch YouTube API key');
    }

    if (!secretData?.key_value) {
      console.error('YouTube API key not found in app_secrets');
      throw new Error('YouTube API key not found or empty');
    }

    const apiKey = secretData.key_value;
    console.log('Making request to YouTube API...');
    
    // Fetch videos from YouTube
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=date&type=video&key=${apiKey}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API error:', errorData);
      throw new Error(errorData.error?.message || 'YouTube API request failed');
    }

    const data = await response.json();
    console.log(`Found ${data.items?.length || 0} videos`);

    if (!data.items?.length) {
      console.warn('No videos found for channel:', channelId);
      return [];
    }

    // Store videos in Supabase
    const videos = data.items.map((item: YouTubeVideo) => ({
      type: 'video',
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail_url: item.snippet.thumbnails.high.url,
      content_url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      source: item.snippet.channelTitle,
      published_at: item.snippet.publishedAt,
      external_id: item.id.videoId,
      metadata: { platform: 'youtube' }
    }));

    console.log(`Storing ${videos.length} videos in database...`);

    const { error: insertError } = await supabase
      .from('content')
      .upsert(videos, { 
        onConflict: 'external_id',
        ignoreDuplicates: false 
      });

    if (insertError) {
      console.error('Error storing videos:', insertError);
      throw new Error('Failed to store videos in database');
    }

    console.log('Videos successfully stored');
    return videos;
  } catch (error) {
    console.error('Error in fetchYouTubeVideos:', error);
    throw error;
  }
};