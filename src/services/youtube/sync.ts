import { supabase } from "@/integrations/supabase/client";
import { getYouTubeApiKey, getChannelDetails } from "./api";
import { YouTubeVideo } from "./types";

const QUOTA_EXCEEDED_ERROR = "YouTube API quota exceeded. Please try again later or contact support to increase your quota.";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.error?.errors?.[0]?.reason === 'quotaExceeded') {
        throw new Error(QUOTA_EXCEEDED_ERROR);
      }
      throw new Error(errorData.error?.message || 'API request failed');
    }
    return response;
  } catch (error) {
    if (retries > 0 && !error.message.includes('quota')) {
      await delay(RETRY_DELAY);
      return fetchWithRetry(url, retries - 1);
    }
    throw error;
  }
}

export const fetchYouTubeVideos = async (channelIdentifier: string, maxResults = 3) => {
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
    
    // Fetch videos from YouTube with retry mechanism
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=date&type=video&key=${apiKey}`;
    console.log('Making request to YouTube API...');
    
    const response = await fetchWithRetry(youtubeUrl);
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
    throw error;
  }
};