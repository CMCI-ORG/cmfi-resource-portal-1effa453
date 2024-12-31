import { supabase } from "@/integrations/supabase/client";
import { YouTubeChannel } from "./types";

export async function getYouTubeApiKey() {
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

export async function getChannelDetails(channelIdentifier: string, apiKey: string): Promise<YouTubeChannel> {
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