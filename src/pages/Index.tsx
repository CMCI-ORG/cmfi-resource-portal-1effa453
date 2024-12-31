import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchYouTubeVideos } from "@/services/youtube";
import { supabase } from "@/integrations/supabase/client";
import ContentCard from "@/components/ContentCard";
import SearchBar from "@/components/SearchBar";
import ContentFilter from "@/components/ContentFilter";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const CHANNEL_ID = "UCmXmlB4-HJytD7wek0Uo97A"; // Replace with your YouTube channel ID

export default function Index() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: videos = [], isLoading, error } = useQuery({
    queryKey: ['youtube-videos'],
    queryFn: () => fetchYouTubeVideos(CHANNEL_ID),
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch videos. Please try again later.",
          variant: "destructive",
        });
      }
    }
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('content-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content'
        },
        (payload) => {
          console.log('Content changed:', payload);
          // Invalidate and refetch content
          // Note: In a production app, you might want to handle this more gracefully
          window.location.reload();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredContent = videos.filter(content => {
    const matchesFilter = filter === "all" || content.type === filter;
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         content.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Content Hub</h1>
      
      <div className="space-y-6 mb-8">
        <SearchBar onSearch={setSearchQuery} />
        <ContentFilter activeFilter={filter} onFilterChange={setFilter} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContent.map((content) => (
          <ContentCard
            key={content.external_id}
            {...content}
          />
        ))}
      </div>

      {filteredContent.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 mt-8">
          No content found. Try adjusting your search or filter.
        </div>
      )}
    </div>
  );
}