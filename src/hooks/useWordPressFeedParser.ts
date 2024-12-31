import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import type { FeedState } from "./wordpress/types"
import { validateFeeds } from "./wordpress/validation"
import { 
  createContentSource,
  checkRateLimit,
  parseFeed,
  insertContent,
  fetchExistingSources as fetchSources,
  deleteSource
} from "./wordpress/feedManagement"

export function useWordPressFeedParser() {
  const [feeds, setFeeds] = useState<FeedState[]>([{ name: "", url: "", displaySummary: true }])
  const [existingSources, setExistingSources] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchExistingSources()
  }, [])

  const fetchExistingSources = async () => {
    const sources = await fetchSources()
    setExistingSources(sources)
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
    
    // Client-side validation
    const validationError = validateFeeds(feeds, existingSources)
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
        const sourceData = await createContentSource(feed.name, feed.url, feed.displaySummary)

        // Check rate limit
        await checkRateLimit(sourceData.id)

        // Parse feed
        const items = await parseFeed(feed.url, sourceData.id, feed.displaySummary)

        // Insert content
        await insertContent(items, feed.name)
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
      await deleteSource(sourceId)

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