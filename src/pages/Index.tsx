import { useQuery } from "@tanstack/react-query";
import { fetchYouTubeVideos } from "@/services/youtube";
import ContentCard from "@/components/ContentCard";
import { useToast } from "@/hooks/use-toast";

const CHANNEL_ID = "YOUR_CHANNEL_ID"; // Replace with your YouTube channel ID

export default function Index() {
  const { toast } = useToast();
  
  const { data: videos = [], isLoading, error } = useQuery({
    queryKey: ['youtube-videos'],
    queryFn: () => fetchYouTubeVideos(CHANNEL_ID),
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch videos. Please try again later.",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Latest Content</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <ContentCard
            key={video.id}
            {...video}
          />
        ))}
      </div>
    </div>
  );
}