import { Button } from "@/components/ui/button"
import { Trash, Edit, RefreshCw } from "lucide-react"

interface Channel {
  id: string
  name: string
  source_id: string
  last_synced_at: string | null
}

interface YouTubeChannelItemProps {
  channel: Channel
  onSync: (channel: Channel) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onEdit: (channel: Channel) => void
  isSyncing: boolean
}

export function YouTubeChannelItem({ 
  channel, 
  onSync, 
  onDelete, 
  onEdit,
  isSyncing 
}: YouTubeChannelItemProps) {
  return (
    <div className="p-4 flex items-center justify-between">
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
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onSync(channel)}
          disabled={isSyncing}
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onEdit(channel)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={() => onDelete(channel.id)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}