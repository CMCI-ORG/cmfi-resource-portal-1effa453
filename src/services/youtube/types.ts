export interface YouTubeVideo {
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

export interface YouTubeChannel {
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