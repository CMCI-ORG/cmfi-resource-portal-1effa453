import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { supabase } from "@/integrations/supabase/client"
import { WordPressFeedForm } from "./wordpress/WordPressFeedForm"
import { WordPressFeedProgress } from "./wordpress/WordPressFeedProgress"

export function WordPressFeedParser() {
  const [feeds, setFeeds] = useState<{ url: string; displaySummary: boolean }[]>([
    { url: "", displaySummary: true },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("")
  const { toast } = useToast()

  const validateFeedUrl = (url: string): boolean => {
    try {
      new URL(url)
      return url.startsWith('http') || url.startsWith('https')
    } catch {
      return false
    }
  }

  const resetState = () => {
    setIsLoading(false)
    setProgress(0)
    setStatus("")
  }

  const handleError = (error: unknown) => {
    console.error("Error parsing feed:", error)
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      })
    }
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to parse feed",
      variant: "destructive",
    })
    resetState()
  }

  const addFeed = () => {
    setFeeds([...feeds, { url: "", displaySummary: true }])
  }

  const removeFeed = (index: number) => {
    setFeeds(feeds.filter((_, i) => i !== index))
  }

  const updateFeed = (index: number, url: string) => {
    const newFeeds = [...feeds]
    newFeeds[index].url = url
    setFeeds(newFeeds)
  }

  const updateDisplaySummary = (index: number, displaySummary: boolean) => {
    const newFeeds = [...feeds]
    newFeeds[index].displaySummary = displaySummary
    setFeeds(newFeeds)
  }

  const parseFeeds = async () => {
    const invalidFeeds = feeds.filter(feed => !validateFeedUrl(feed.url))
    if (invalidFeeds.length > 0) {
      toast({
        title: "Error",
        description: "Please enter valid feed URLs",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setProgress(10)
    setStatus("Initializing feed parser...")

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw new Error("Authentication error: " + authError.message)
      if (!user) throw new Error("You must be logged in to perform this action")

      const { data: isAdmin, error: adminCheckError } = await supabase
        .rpc('is_admin', { user_id: user.id })
      
      if (adminCheckError) throw new Error("Failed to verify admin status: " + adminCheckError.message)
      if (!isAdmin) throw new Error("You must be an admin to manage content sources")

      for (let i = 0; i < feeds.length; i++) {
        const feed = feeds[i]
        setProgress((i + 1) * (90 / feeds.length))
        setStatus(`Processing feed ${i + 1} of ${feeds.length}...`)

        // First, add the feed source
        const { data: sourceData, error: sourceError } = await supabase
          .from("content_sources")
          .insert({
            type: "wordpress",  // Explicitly using lowercase to match the constraint
            name: new URL(feed.url).hostname,
            source_url: feed.url,
            source_id: feed.url,
            feed_url: feed.url,
            display_summary: feed.displaySummary,
          })
          .select()
          .maybeSingle()

        if (sourceError) {
          console.error("Source insertion error:", sourceError)
          throw new Error(`Failed to add content source: ${sourceError.message}`)
        }

        if (!sourceData) {
          throw new Error("Failed to create content source")
        }

        // Then fetch and parse the feed
        const { data: feedData, error: feedError } = await supabase.functions.invoke(
          "parse-wordpress-feed",
          {
            body: { 
              url: feed.url,
              sourceId: sourceData.id,
              displaySummary: feed.displaySummary 
            }
          }
        )

        if (feedError) throw feedError
        if (!feedData?.items) throw new Error("No articles found in feed")

        // Insert blog posts into the database
        const { error: insertError } = await supabase.from("content").insert(
          feedData.items.map((item: any) => ({
            type: "blog",
            title: item.title,
            description: item.description,
            content_url: item.link,
            thumbnail_url: item.thumbnail,
            source: new URL(feed.url).hostname,
            published_at: item.pubDate,
            external_id: item.guid,
            metadata: {
              categories: item.categories,
              tags: item.tags,
              author: item.author,
            },
          }))
        )

        if (insertError) throw insertError
      }

      setProgress(100)
      setStatus("Import completed successfully!")

      toast({
        title: "Success",
        description: "WordPress feeds parsed and articles imported successfully",
      })

      // Reset form after successful import
      setFeeds([{ url: "", displaySummary: true }])
    } catch (error) {
      handleError(error)
    } finally {
      setTimeout(() => {
        resetState()
      }, 2000)
    }
  }

  return (
    <ErrorBoundary>
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
            onUpdateDisplaySummary={updateDisplaySummary}
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