import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ContentCard from "@/components/ContentCard";
import SearchBar from "@/components/SearchBar";
import ContentFilter from "@/components/ContentFilter";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

export default function Index() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: content = [], isLoading, error } = useQuery({
    queryKey: ['content'],
    queryFn: async () => {
      console.log('Fetching content from database...');
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .order("published_at", { ascending: false });

      if (error) {
        console.error('Error fetching content:', error);
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} content items`);
      return data || [];
    },
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch content. Please try again later.",
          variant: "destructive",
        });
      }
    }
  });

  // Set up real-time subscription for content updates
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
          window.location.reload();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredContent = content.filter(item => {
    const matchesFilter = filter === "all" || item.type === filter;
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Content</h2>
        <p className="text-gray-600">Please try refreshing the page.</p>
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
        {filteredContent.map((item) => (
          <ContentCard
            key={item.id}
            type={item.type}
            title={item.title}
            description={item.description || ""}
            thumbnail={item.thumbnail_url || ""}
            date={new Date(item.published_at).toLocaleDateString()}
            source={item.source}
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