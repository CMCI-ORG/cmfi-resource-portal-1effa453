import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { Loader2 } from "lucide-react"

export function PodcastFeedParser() {
  const [feedUrl, setFeedUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const parseFeed = async () => {
    if (!feedUrl) {
      toast({
        title: "Error",
        description: "Please enter a feed URL",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('parse-podcast-feed', {
        body: { url: feedUrl }
      })

      if (error) throw error
      if (!data?.items) throw new Error("No episodes found in feed")

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

      if (insertError) throw insertError

      toast({
        title: "Success",
        description: "Podcast feed parsed and episodes imported successfully",
      })
    } catch (error) {
      console.error("Error parsing feed:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to parse feed",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
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
          />
          <Button onClick={parseFeed} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}