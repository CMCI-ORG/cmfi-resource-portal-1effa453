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

    // First, let's check if we have any API keys in the table
    const { data: allSecrets, error: listError } = await supabase
      .from('app_secrets')
      .select('*');

    if (listError) {
      console.error('Error listing secrets:', listError);
      throw new Error('Failed to check secrets table');
    }

    console.log('Total secrets in table:', allSecrets.length);
    console.log('Available secret keys:', allSecrets.map(s => s.key_name).join(', '));

    // Now fetch the YouTube API key specifically
    const { data: secretData, error: secretError } = await supabase
      .from('app_secrets')
      .select('*')
      .eq('key_name', 'YOUTUBE_API_KEY')
      .maybeSingle();  // Changed from .single() to .maybeSingle()

    if (secretError) {
      console.error('Error fetching API key:', secretError);
      throw new Error('Failed to fetch YouTube API key from database');
    }

    if (!secretData) {
      console.error('No YouTube API key found in database');
      throw new Error('YouTube API key not found. Please add it in the Supabase settings.');
    }

    console.log('API key record found:', {
      id: secretData.id,
      key_name: secretData.key_name,
      key_length: secretData.key_value?.length || 0,
      created_at: secretData.created_at
    });

    const apiKey = secretData.key_value?.trim();
    if (!apiKey) {
      console.error('API key is empty or contains only whitespace');
      throw new Error('YouTube API key is empty. Please provide a valid API key.');
    }

    // Test if the API key format looks valid (basic check)
    if (apiKey.length < 20) {
      console.error('API key seems too short to be valid');
      throw new Error('YouTube API key appears invalid. Please check the key format.');
    }

    console.log('API key validation passed. Length:', apiKey.length);
    
    // Fetch videos from YouTube
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=date&type=video&key=${apiKey}`;
    
    console.log('Making request to YouTube API...');
    const response = await fetch(youtubeUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API error response:', errorData);
      throw new Error(errorData.error?.message || 'YouTube API request failed');
    }

    const data = await response.json();
    console.log(`Found ${data.items?.length || 0} videos`);

    if (!data.items?.length) {
      console.warn('No videos found for channel:', channelId);
      return [];
    }

    // Transform and store videos
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