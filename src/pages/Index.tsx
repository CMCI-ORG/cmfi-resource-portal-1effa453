import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ContentCard from "@/components/ContentCard";
import SearchBar from "@/components/SearchBar";
import ContentFilter from "@/components/ContentFilter";
import { fetchYouTubeVideos } from "@/services/youtube";
import { useToast } from "@/components/ui/use-toast";

// Example channel ID - replace with your actual channel ID
const CHANNEL_ID = "UC_x5XG1OV2P6uZZ5FSM9Ttw"; // Google Developers channel

const Index = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: videos = [], isLoading, error } = useQuery({
    queryKey: ['youtube-videos', CHANNEL_ID],
    queryFn: () => fetchYouTubeVideos(CHANNEL_ID),
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch videos. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const filteredContent = videos.filter((item) => {
    const matchesFilter = activeFilter === "all" || item.type === activeFilter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Content Hub</h1>
          <p className="text-lg text-gray-600 mb-8">
            Discover our latest videos, blogs, and podcasts all in one place
          </p>
          <SearchBar onSearch={setSearchQuery} />
        </header>

        <section className="mb-8">
          <ContentFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading videos...</p>
            </div>
          ) : filteredContent.length > 0 ? (
            filteredContent.map((content) => (
              <ContentCard key={content.id} {...content} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">No content found matching your criteria.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Index;