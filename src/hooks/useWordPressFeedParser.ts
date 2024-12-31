import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface FeedState {
  name: string
  url: string
  displaySummary: boolean
}

export function useWordPressFeedParser() {
  const [feeds, setFeeds] = useState<FeedState[]>([{ name: "", url: "", displaySummary: true }])
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const validateFeedUrl = (url: string): boolean => {
    try {
      new URL(url)
      return url.startsWith('http') || url.startsWith('https')
    } catch {
      return false
    }
  }

  const validateFeedName = (name: string): boolean => {
    return name.length > 0
  }

  const resetState = () => {
    setIsLoading(false)
    setProgress(0)
    setStatus("")
    setError(null)
  }

  const handleError = (error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : "Failed to parse feed"
    setError(errorMessage)
    console.error("Error parsing feed:", error)
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    })
    resetState()
  }

  const addFeed = () => setFeeds([...feeds, { name: "", url: "", displaySummary: true }])
  const removeFeed = (index: number) => setFeeds(feeds.filter((_, i) => i !== index))
  const updateFeed = (index: number, field: keyof FeedState, value: string | boolean) => {
    const newFeeds = [...feeds]
    newFeeds[index] = { ...newFeeds[index], [field]: value }
    setFeeds(newFeeds)
  }

  const parseFeeds = async () => {
    setError(null)
    const invalidFeeds = feeds.filter(feed => !validateFeedUrl(feed.url) || !validateFeedName(feed.name))
    if (invalidFeeds.length > 0) {
      toast({
        title: "Error",
        description: "Please enter valid feed names and URLs",
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

        const { data: sourceData, error: sourceError } = await supabase
          .from("content_sources")
          .insert({
            type: "wordpress",  // Changed from "blog" to "wordpress"
            name: feed.name,
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

        const { error: insertError } = await supabase.from("content").insert(
          feedData.items.map((item: any) => ({
            type: "blog",  // This remains "blog" as it's an enum in the content table
            title: item.title,
            description: item.description,
            content_url: item.link,
            thumbnail_url: item.thumbnail,
            source: feed.name,
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

      setFeeds([{ name: "", url: "", displaySummary: true }])
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
    error,
    addFeed,
    removeFeed,
    updateFeed,
    parseFeeds
  }
}