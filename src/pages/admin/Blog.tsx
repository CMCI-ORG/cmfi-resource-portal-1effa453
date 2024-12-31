import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { WordPressFeedParser } from "@/components/admin/WordPressFeedParser"
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

  // Fetch latest blog posts
  const { data: latestPosts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ['latest-blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('type', 'blog')
        .order('published_at', { ascending: false })
        .limit(3)

      if (error) throw error
      return data
    }
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

              <WordPressFeedParser />
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ErrorBoundary>
  )
}