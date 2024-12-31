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

interface YouTubeChannel {
  id: string;
  snippet: {
    title: string;
    description: string;
  };
  brandingSettings?: {
    channel?: {
      country?: string;
    };
  };
}

async function getYouTubeApiKey() {
  const { data, error } = await supabase
    .from("app_secrets")
    .select("key_value")
    .eq("key_name", "YOUTUBE_API_KEY")
    .maybeSingle();

  if (error) {
    console.error("Error fetching API key:", error);
    throw new Error("Failed to fetch YouTube API key");
  }

  if (!data?.key_value) {
    throw new Error("YouTube API key not found. Please add it in the YouTube settings.");
  }

  return data.key_value;
}

async function getChannelDetails(channelIdentifier: string, apiKey: string): Promise<YouTubeChannel> {
  let endpoint = '';
  
  if (channelIdentifier.startsWith('@')) {
    // First get channel ID from handle
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(channelIdentifier)}&key=${apiKey}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API error response:', errorData);
      throw new Error(errorData.error?.message || 'Failed to fetch channel ID');
    }

    const data = await response.json();
    if (!data.items?.[0]?.id?.channelId) {
      throw new Error(`No channel found for handle: ${channelIdentifier}`);
    }
    
    channelIdentifier = data.items[0].id.channelId;
  }

  // Get channel details including location
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&id=${channelIdentifier}&key=${apiKey}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error('YouTube API error response:', errorData);
    throw new Error(errorData.error?.message || 'Failed to fetch channel details');
  }

  const data = await response.json();
  if (!data.items?.[0]) {
    throw new Error(`No channel found with ID: ${channelIdentifier}`);
  }

  return data.items[0];
}

export const fetchYouTubeVideos = async (channelIdentifier: string, maxResults = 10) => {
  try {
    console.log('Fetching videos for channel:', channelIdentifier);
    
    if (!channelIdentifier) {
      throw new Error('Channel ID or handle is required');
    }

    const apiKey = await getYouTubeApiKey();
    console.log('API key retrieved successfully');
    
    // Get channel details including location
    const channelDetails = await getChannelDetails(channelIdentifier, apiKey);
    const channelId = channelDetails.id;
    const location = channelDetails.brandingSettings?.channel?.country || null;
    
    console.log('Channel location:', location);

    // Update the channel location in the database
    const { error: updateError } = await supabase
      .from("content_sources")
      .update({ location })
      .eq("source_id", channelIdentifier);

    if (updateError) {
      console.error('Error updating channel location:', updateError);
    }

    // Get the channel name from content_sources
    const { data: sourceData, error: sourceError } = await supabase
      .from("content_sources")
      .select("name")
      .eq("source_id", channelIdentifier)
      .single();

    if (sourceError) {
      console.error('Error fetching source:', sourceError);
      throw sourceError;
    }

    const channelName = sourceData.name;
    
    // Fetch videos from YouTube
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=date&type=video&key=${apiKey}`;
    console.log('Making request to YouTube API...');
    
    const response = await fetch(youtubeUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API error response:', errorData);

      if (errorData.error?.code === 403) {
        if (errorData.error.message.includes('API not enabled')) {
          throw new Error(
            'The YouTube Data API is not enabled. Please visit the Google Cloud Console to enable it: ' +
            'https://console.developers.google.com/apis/library/youtube.googleapis.com'
          );
        }
        if (errorData.error.message.includes('quota')) {
          throw new Error(
            'YouTube API quota exceeded. Please try again later or check your quota limits in the Google Cloud Console.'
          );
        }
        if (errorData.error.message.includes('invalid')) {
          throw new Error(
            'Invalid YouTube API key. Please check your API key in the YouTube settings.'
          );
        }
      }
      
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
      source: channelName,
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
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while fetching YouTube videos');
  }
};