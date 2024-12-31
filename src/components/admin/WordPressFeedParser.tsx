import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { WordPressFeedForm } from "./wordpress/WordPressFeedForm"
import { WordPressFeedProgress } from "./wordpress/WordPressFeedProgress"
import { useWordPressFeedParser } from "@/hooks/useWordPressFeedParser"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"

export function WordPressFeedParser() {
  const navigate = useNavigate()
  const {
    feeds,
    isLoading,
    progress,
    status,
    addFeed,
    removeFeed,
    updateFeed,
    parseFeeds,
    error
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
    </ErrorBoundary>
  )
}