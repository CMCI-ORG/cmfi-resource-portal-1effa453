import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface FeedState {
  url: string
  displaySummary: boolean
}

export function useWordPressFeedParser() {
  const [feeds, setFeeds] = useState<FeedState[]>([{ url: "", displaySummary: true }])
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
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to parse feed",
      variant: "destructive",
    })
    resetState()
  }

  const addFeed = () => setFeeds([...feeds, { url: "", displaySummary: true }])
  const removeFeed = (index: number) => setFeeds(feeds.filter((_, i) => i !== index))
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

        // First, add the feed source with explicit lowercase type
        const { data: sourceData, error: sourceError } = await supabase
          .from("content_sources")
          .insert({
            type: "wordpress",  // Explicitly using lowercase to match constraint
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

  return {
    feeds,
    isLoading,
    progress,
    status,
    addFeed,
    removeFeed,
    updateFeed,
    updateDisplaySummary,
    parseFeeds
  }
}