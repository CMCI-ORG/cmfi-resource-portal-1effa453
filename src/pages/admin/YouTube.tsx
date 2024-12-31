import { useEffect, useState } from "react"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { YouTubeChannelForm } from "@/components/admin/youtube/YouTubeChannelForm"
import { YouTubeChannelList } from "@/components/admin/youtube/YouTubeChannelList"
import { ContentCard } from "@/components/ContentCard"
import { supabase } from "@/integrations/supabase/client"

interface Video {
  id: string
  title: string
  description: string
  thumbnail_url: string
  content_url: string
  source: string
  published_at: string
}

export default function YouTube() {
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("type", "video")
        .order("published_at", { ascending: false })
        .limit(12)

      if (error) throw error
      setVideos(data)
    } catch (error) {
      console.error("Error fetching videos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  const handleRefresh = () => {
    fetchVideos()
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">YouTube Management</h1>
            <div className="grid gap-8">
              <YouTubeChannelForm onSuccess={handleRefresh} />
              <YouTubeChannelList onRefresh={handleRefresh} />
              
              <div>
                <h2 className="text-2xl font-semibold mb-4">Recent Videos</h2>
                {isLoading ? (
                  <p>Loading videos...</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}