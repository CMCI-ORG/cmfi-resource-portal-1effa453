import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/integrations/supabase/client"
import { Loader2 } from "lucide-react"
import { ErrorBoundary } from "@/components/ErrorBoundary"

export function PodcastFeedParser() {
  const [feedUrl, setFeedUrl] = useState("")
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

  const parseFeed = async () => {
    if (!feedUrl) {
      toast({
        title: "Error",
        description: "Please enter a feed URL",
        variant: "destructive",
      })
      return
    }

    if (!validateFeedUrl(feedUrl)) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setProgress(10)
    setStatus("Initializing feed parser...")

    try {
      setProgress(30)
      setStatus("Fetching podcast feed...")
      
      const { data, error } = await supabase.functions.invoke('parse-podcast-feed', {
        body: { url: feedUrl }
      })

      if (error) throw error
      if (!data?.items) throw new Error("No episodes found in feed")

      setProgress(60)
      setStatus("Processing episodes...")

      // Insert podcast episodes into the database
      const { error: insertError } = await supabase.from("content").insert(
        data.items.map((item: any) => ({
          type: "podcast",
          title: item.title,
          description: item.description,
          content_url: item.url,
          thumbnail_url: item.thumbnail,
          source: "soundcloud",
          published_at: item.pubDate,
          external_id: item.guid,
          metadata: {
            duration: item.duration,
            author: item.author,
          },
        }))
      )

      setProgress(90)
      setStatus("Finalizing import...")

      if (insertError) throw insertError

      setProgress(100)
      setStatus("Import completed successfully!")

      toast({
        title: "Success",
        description: "Podcast feed parsed and episodes imported successfully",
      })
    } catch (error) {
      handleError(error)
    } finally {
      setTimeout(() => {
        resetState()
      }, 2000)
    }
  }

  const PodcastFeedForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>Import SoundCloud Podcast</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Input
            placeholder="Enter SoundCloud RSS feed URL"
            value={feedUrl}
            onChange={(e) => setFeedUrl(e.target.value)}
            className="flex-1"
            disabled={isLoading}
            data-testid="feed-url-input"
          />
          <Button 
            onClick={parseFeed} 
            disabled={isLoading}
            data-testid="import-button"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import
          </Button>
        </div>
        {isLoading && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" data-testid="progress-bar" />
            <p className="text-sm text-gray-500 text-center animate-pulse" data-testid="status-message">
              {status}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <ErrorBoundary>
      <PodcastFeedForm />
    </ErrorBoundary>
  )
}