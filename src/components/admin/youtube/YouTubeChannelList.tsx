import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Trash } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface Channel {
  id: string
  name: string
  source_id: string
  last_synced_at: string | null
}

export function YouTubeChannelList() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    checkAuthAndFetchChannels()
  }, [])

  async function checkAuthAndFetchChannels() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to view YouTube channels.",
          variant: "destructive",
        })
        navigate("/login")
        return
      }
      await fetchChannels()
    } catch (error) {
      console.error("Auth check error:", error)
      setIsLoading(false)
    }
  }

  async function fetchChannels() {
    try {
      const { data, error } = await supabase
        .from("content_sources")
        .select("*")
        .eq("type", "youtube")
        .order("created_at", { ascending: false })

      if (error) {
        if (error.code === "42501") {
          toast({
            title: "Permission denied",
            description: "You don't have permission to view YouTube channels.",
            variant: "destructive",
          })
          return
        }
        throw error
      }

      setChannels(data)
    } catch (error) {
      console.error("Error fetching channels:", error)
      toast({
        title: "Error fetching channels",
        description: "There was a problem loading the YouTube channels.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to delete YouTube channels.",
          variant: "destructive",
        })
        navigate("/login")
        return
      }

      const { error } = await supabase
        .from("content_sources")
        .delete()
        .eq("id", id)

      if (error) {
        if (error.code === "42501") {
          toast({
            title: "Permission denied",
            description: "You don't have permission to delete YouTube channels.",
            variant: "destructive",
          })
          return
        }
        throw error
      }

      setChannels((prev) => prev.filter((channel) => channel.id !== id))
      toast({
        title: "Channel deleted",
        description: "The YouTube channel has been removed from your sources.",
      })
    } catch (error) {
      console.error("Error deleting channel:", error)
      toast({
        title: "Error deleting channel",
        description: "There was a problem deleting the YouTube channel.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div>Loading channels...</div>
  }

  return (
    <div className="rounded-lg border">
      <h2 className="text-lg font-semibold p-4 border-b">YouTube Channels</h2>
      {channels.length === 0 ? (
        <p className="p-4 text-center text-gray-500">
          No YouTube channels added yet.
        </p>
      ) : (
        <div className="divide-y">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="p-4 flex items-center justify-between"
            >
              <div>
                <h3 className="font-medium">{channel.name}</h3>
                <p className="text-sm text-gray-500">ID: {channel.source_id}</p>
                <p className="text-sm text-gray-500">
                  Last synced:{" "}
                  {channel.last_synced_at
                    ? new Date(channel.last_synced_at).toLocaleString()
                    : "Never"}
                </p>
              </div>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDelete(channel.id)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}