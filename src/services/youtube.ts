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
    
    // Validate channelId
    if (!channelId) {
      throw new Error('Channel ID is required');
    }

    // Fetch API key from Supabase with detailed error logging
    console.log('Fetching YouTube API key from app_secrets...');
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
      // Let's verify if the key exists at all
      const { count, error: countError } = await supabase
        .from('app_secrets')
        .select('*', { count: 'exact', head: true })
        .eq('key_name', 'YOUTUBE_API_KEY');
      
      if (countError) {
        console.error('Error checking for API key existence:', countError);
      } else {
        console.log('Number of API key entries found:', count);
      }
      throw new Error('YouTube API key not found. Please add it in the Supabase settings.');
    }

    const apiKey = secretData.key_value;
    console.log('API key retrieved successfully, making request to YouTube API...');
    
    // Fetch videos from YouTube with error handling
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=date&type=video&key=${apiKey}`;
    
    const response = await fetch(youtubeUrl);
    
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

    // Transform and store videos in Supabase
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

    // Store videos with better error handling
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
    // Re-throw the error with a more specific message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while fetching YouTube videos');
  }
};