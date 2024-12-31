import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2 } from "lucide-react"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { WordPressFeedForm } from "./wordpress/WordPressFeedForm"
import { WordPressFeedProgress } from "./wordpress/WordPressFeedProgress"
import { useWordPressFeedParser } from "@/hooks/useWordPressFeedParser"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { format } from "date-fns"

export function WordPressFeedParser() {
  const navigate = useNavigate()
  const {
    feeds,
    existingSources,
    isLoading,
    progress,
    status,
    error,
    addFeed,
    removeFeed,
    updateFeed,
    parseFeeds,
    deleteFeedSource,
  } = useWordPressFeedParser()

  // Verify admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        navigate("/login")
        return
      }

      const { data: isAdmin, error: adminCheckError } = await supabase
        .rpc('is_admin', { user_id: user.id })
      
      if (adminCheckError || !isAdmin) {
        navigate("/")
      }
    }

    checkAdminStatus()
  }, [navigate])

  // Custom error fallback for the component
  const fallback = (
    <Card>
      <CardHeader>
        <CardTitle>Error Loading Feed Parser</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-red-500">
          There was an error loading the feed parser. Please try refreshing the page.
        </p>
      </CardContent>
    </Card>
  )

  return (
    <ErrorBoundary fallback={fallback}>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Import WordPress Blogs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <WordPressFeedForm
              feeds={feeds}
              isLoading={isLoading}
              onAddFeed={addFeed}
              onRemoveFeed={removeFeed}
              onUpdateFeed={updateFeed}
              error={error}
            />
            
            <Button 
              onClick={parseFeeds} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import
            </Button>

            {isLoading && <WordPressFeedProgress progress={progress} status={status} />}
          </CardContent>
        </Card>

        {existingSources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Existing Feed Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {existingSources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <h3 className="font-medium">{source.name}</h3>
                      <p className="text-sm text-gray-500">{source.feed_url}</p>
                      <p className="text-xs text-gray-400">
                        Last import: {source.last_import_attempt ? 
                          format(new Date(source.last_import_attempt), 'PPpp') : 
                          'Never'}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteFeedSource(source.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ErrorBoundary>
  )
}