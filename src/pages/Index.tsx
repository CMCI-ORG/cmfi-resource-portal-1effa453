import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import ContentCard from "@/components/ContentCard"
import { useToast } from "@/components/ui/use-toast"

interface Video {
  id: string
  title: string
  description: string
  thumbnail_url: string
  content_url: string
  source: string
  published_at: string
}

export default function Index() {
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      console.log('Fetching videos from database...')
      
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("type", "video")
        .order("published_at", { ascending: false })

      if (error) {
        console.error('Error fetching videos:', error)
        throw error
      }
      
      console.log(`Found ${data?.length || 0} videos`)
      setVideos(data || [])
    } catch (error) {
      console.error("Error fetching videos:", error)
      toast({
        title: "Error",
        description: "Failed to fetch videos. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Latest Videos</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <p>Loading videos...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>No videos available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <ContentCard
              key={video.id}
              type="video"
              title={video.title}
              description={video.description || ""}
              thumbnail={video.thumbnail_url || ""}
              date={new Date(video.published_at).toLocaleDateString()}
              source={video.source}
            />
          ))}
        </div>
      )}
    </div>
  )
}