import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useNavigate } from "react-router-dom"
import { fetchYouTubeVideos } from "@/services/youtube"
import { YouTubeChannelItem } from "./YouTubeChannelItem"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Channel {
  id: string
  name: string
  source_id: string
  last_synced_at: string | null
}

export function YouTubeChannelList({ onRefresh }: { onRefresh?: () => void }) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState<string | null>(null)
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null)
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
      if (onRefresh) onRefresh()
    } catch (error) {
      console.error("Error deleting channel:", error)
      toast({
        title: "Error deleting channel",
        description: "There was a problem deleting the YouTube channel.",
        variant: "destructive",
      })
    }
  }

  async function handleSync(channel: Channel) {
    try {
      setIsSyncing(channel.id)
      await fetchYouTubeVideos(channel.source_id)
      
      // Update last_synced_at
      const { error } = await supabase
        .from("content_sources")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", channel.id)

      if (error) throw error

      toast({
        title: "Channel synced",
        description: "Videos have been updated successfully.",
      })
      
      fetchChannels() // Refresh the list to show updated last_synced_at
      if (onRefresh) onRefresh() // Refresh the videos list
    } catch (error) {
      console.error("Error syncing videos:", error)
      toast({
        title: "Sync failed",
        description: "There was a problem syncing the YouTube videos.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(null)
    }
  }

  async function handleEdit(channel: Channel) {
    try {
      const { error } = await supabase
        .from("content_sources")
        .update({
          name: channel.name,
          source_id: channel.source_id,
        })
        .eq("id", channel.id)

      if (error) throw error

      toast({
        title: "Channel updated",
        description: "The channel information has been updated successfully.",
      })

      setEditingChannel(null)
      fetchChannels()
    } catch (error) {
      console.error("Error updating channel:", error)
      toast({
        title: "Update failed",
        description: "There was a problem updating the channel information.",
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Channel Name</TableHead>
              <TableHead>Channel ID</TableHead>
              <TableHead>Last Synced</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channels.map((channel) => (
              <YouTubeChannelItem
                key={channel.id}
                channel={channel}
                onSync={handleSync}
                onDelete={handleDelete}
                onEdit={handleEdit}
                isEditing={editingChannel?.id === channel.id}
                onStartEdit={() => setEditingChannel(channel)}
                onCancelEdit={() => setEditingChannel(null)}
                isSyncing={isSyncing === channel.id}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}