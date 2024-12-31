import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import ContentCard from "@/components/ContentCard"
import SearchBar from "@/components/SearchBar"
import ContentFilter from "@/components/ContentFilter"
import { useToast } from "@/components/ui/use-toast"

interface Content {
  id: string
  type: "video" | "blog" | "podcast"
  title: string
  description: string
  thumbnail_url: string
  content_url: string
  source: string
  published_at: string
}

export default function Index() {
  const [content, setContent] = useState<Content[]>([])
  const [filteredContent, setFilteredContent] = useState<Content[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchContent()
  }, [])

  useEffect(() => {
    filterContent()
  }, [content, activeFilter, searchQuery])

  const fetchContent = async () => {
    try {
      console.log('Fetching content from database...')
      
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .order("published_at", { ascending: false })

      if (error) {
        console.error('Error fetching content:', error)
        throw error
      }
      
      console.log(`Found ${data?.length || 0} content items`)
      setContent(data || [])
    } catch (error) {
      console.error("Error fetching content:", error)
      toast({
        title: "Error",
        description: "Failed to fetch content. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterContent = () => {
    let filtered = content

    // Apply type filter
    if (activeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === activeFilter)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query))
      )
    }

    setFilteredContent(filtered)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-8">Content Hub</h1>
        <div className="space-y-6">
          <SearchBar onSearch={handleSearch} />
          <ContentFilter
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
          />
        </div>
      </header>
      
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <p>Loading content...</p>
        </div>
      ) : filteredContent.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>No content available matching your criteria.</p>
        </div>
      ) : (
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
      )}
    </div>
  )
}