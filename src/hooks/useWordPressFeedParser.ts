import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface FeedState {
  name: string
  url: string
  displaySummary: boolean
}

export function useWordPressFeedParser() {
  const [feeds, setFeeds] = useState<FeedState[]>([{ name: "", url: "", displaySummary: true }])
  const [existingSources, setExistingSources] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch existing sources on mount
  useEffect(() => {
    fetchExistingSources()
  }, [])

  const fetchExistingSources = async () => {
    const { data, error } = await supabase
      .from("content_sources")
      .select("*")
      .eq("type", "wordpress")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching sources:", error)
      return
    }

    setExistingSources(data || [])
  }

  const validateFeedUrl = (url: string): boolean => {
    try {
      new URL(url)
      return url.startsWith('http') || url.startsWith('https')
    } catch {
      return false
    }
  }

  const validateFeedName = (name: string): boolean => {
    return name.trim().length >= 3 && name.trim().length <= 50
  }

  const isDuplicateFeed = (url: string): boolean => {
    return existingSources.some(source => source.feed_url === url)
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

  const validateFeeds = (): string | null => {
    for (const feed of feeds) {
      if (!validateFeedName(feed.name)) {
        return "Feed names must be between 3 and 50 characters"
      }
      if (!validateFeedUrl(feed.url)) {
        return "Please enter valid feed URLs (must start with http:// or https://)"
      }
      if (isDuplicateFeed(feed.url)) {
        return "One or more feeds have already been imported"
      }
    }
    return null
  }

  const parseFeeds = async () => {
    setError(null)
    
    // Client-side validation
    const validationError = validateFeeds()
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
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

        // Create content source
        const { data: sourceData, error: sourceError } = await supabase
          .from("content_sources")
          .insert({
            type: "wordpress",
            name: feed.name,
            source_url: feed.url,
            source_id: feed.url,
            feed_url: feed.url,
            display_summary: feed.displaySummary,
            last_import_attempt: new Date().toISOString()
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

        // Check rate limit
        const { data: isAllowed, error: rateLimitError } = await supabase
          .rpc('check_import_rate_limit', { source_id: sourceData.id })

        if (rateLimitError) throw new Error("Failed to check rate limit: " + rateLimitError.message)
        if (!isAllowed) {
          throw new Error("Rate limit exceeded. Please wait 15 minutes between imports.")
        }

        // Parse feed
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

        // Insert content with duplicate handling
        const { error: insertError } = await supabase.from("content").insert(
          feedData.items.map((item: any) => ({
            type: "blog",
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
        ).onConflict(['external_id', 'source']).ignore()

        if (insertError) throw insertError
      }

      setProgress(100)
      setStatus("Import completed successfully!")

      toast({
        title: "Success",
        description: "WordPress feeds parsed and articles imported successfully",
      })

      // Refresh existing sources
      await fetchExistingSources()
      setFeeds([{ name: "", url: "", displaySummary: true }])
    } catch (error) {
      handleError(error)
    } finally {
      setTimeout(() => {
        resetState()
      }, 2000)
    }
  }

  const deleteFeedSource = async (sourceId: string) => {
    try {
      const { error } = await supabase
        .from("content_sources")
        .delete()
        .eq("id", sourceId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Feed source deleted successfully",
      })

      await fetchExistingSources()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete feed source",
        variant: "destructive",
      })
    }
  }

  return {
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
    deleteFeedSource
  }
}