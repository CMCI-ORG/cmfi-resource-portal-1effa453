import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { WordPressFeedParser } from "@/components/admin/WordPressFeedParser"
import { WordPressFeedsTable } from "@/components/admin/wordpress/WordPressFeedsTable"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import ContentCard from "@/components/ContentCard"

export default function Blog() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)

  // Fetch latest blog posts with debugging
  const { data: latestPosts, isLoading: isLoadingPosts, error } = useQuery({
    queryKey: ['latest-blog-posts'],
    queryFn: async () => {
      console.log('Fetching latest blog posts...')
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('type', 'blog')
        .order('published_at', { ascending: false })
        .limit(3)

      if (error) {
        console.error('Error fetching blog posts:', error)
        throw error
      }
      
      console.log('Fetched blog posts:', data)
      return data
    },
    // Ensure the query runs after authentication check
    enabled: !isLoading
  })

  // Fetch WordPress feeds
  const { 
    data: feeds, 
    isLoading: isLoadingFeeds,
    refetch: refetchFeeds
  } = useQuery({
    queryKey: ['wordpress-feeds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_sources')
        .select('*')
        .eq('type', 'wordpress')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !isLoading
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          navigate("/login")
          return
        }

        const { data: isAdmin, error: adminError } = await supabase
          .rpc('is_admin', { user_id: user.id })
        
        if (adminError || !isAdmin) {
          navigate("/")
          return
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [navigate])

  // Debug output
  useEffect(() => {
    if (error) {
      console.error('Query error:', error)
    }
    if (latestPosts) {
      console.log('Latest posts in component:', latestPosts)
    }
  }, [latestPosts, error])

  const handleDeleteFeed = async (id: string) => {
    const { error } = await supabase
      .from('content_sources')
      .delete()
      .eq('id', id)

    if (error) throw error
    refetchFeeds()
  }

  const handleRefreshFeed = async (id: string) => {
    // Update last_import_attempt to trigger a new import
    const { error } = await supabase
      .from('content_sources')
      .update({ last_import_attempt: null })
      .eq('id', id)

    if (error) throw error
    refetchFeeds()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-lg text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AdminSidebar />
          <main className="flex-1 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
              <h1 className="text-3xl font-bold">Blog Management</h1>
              
              {/* Latest Posts Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Latest Posts</h2>
                {isLoadingPosts ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="text-red-500 text-center py-4">
                    Error loading posts: {error.message}
                  </div>
                ) : latestPosts && latestPosts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {latestPosts.map((post) => (
                      <ContentCard
                        key={post.id}
                        type="blog"
                        title={post.title}
                        description={post.description || ""}
                        thumbnail={post.thumbnail_url || "/placeholder.svg"}
                        date={new Date(post.published_at).toLocaleDateString()}
                        source={post.source}
                        contentUrl={post.content_url}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No blog posts found. Use the form below to import some posts.
                  </p>
                )}
              </div>

              {/* WordPress Feed Management */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">WordPress Feeds</h2>
                <WordPressFeedParser onSuccess={refetchFeeds} />
                
                {isLoadingFeeds ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <WordPressFeedsTable
                    feeds={feeds || []}
                    onDelete={handleDeleteFeed}
                    onRefresh={handleRefreshFeed}
                    isLoading={isLoadingFeeds}
                  />
                )}
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ErrorBoundary>
  )
}