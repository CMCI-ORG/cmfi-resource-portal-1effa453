import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TableCell, TableRow } from "@/components/ui/table"
import { Trash, Edit, RefreshCw, X, Check } from "lucide-react"

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
  onEdit: (channel: Channel) => Promise<void>
  isEditing: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  isSyncing: boolean
}

export function YouTubeChannelItem({ 
  channel, 
  onSync, 
  onDelete, 
  onEdit,
  isEditing,
  onStartEdit,
  onCancelEdit,
  isSyncing 
}: YouTubeChannelItemProps) {
  const [editedName, setEditedName] = useState(channel.name)
  const [editedSourceId, setEditedSourceId] = useState(channel.source_id)

  const handleSave = () => {
    onEdit({
      ...channel,
      name: editedName,
      source_id: editedSourceId,
    })
  }

  if (isEditing) {
    return (
      <TableRow>
        <TableCell>
          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            placeholder="Channel name"
          />
        </TableCell>
        <TableCell>
          <Input
            value={editedSourceId}
            onChange={(e) => setEditedSourceId(e.target.value)}
            placeholder="Channel ID or @handle"
          />
        </TableCell>
        <TableCell>
          {channel.last_synced_at
            ? new Date(channel.last_synced_at).toLocaleString()
            : "Never"}
        </TableCell>
        <TableCell className="text-right space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleSave}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onCancelEdit}
          >
            <X className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow>
      <TableCell>{channel.name}</TableCell>
      <TableCell>{channel.source_id}</TableCell>
      <TableCell>
        {channel.last_synced_at
          ? new Date(channel.last_synced_at).toLocaleString()
          : "Never"}
      </TableCell>
      <TableCell className="text-right space-x-2">
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
          onClick={onStartEdit}
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
      </TableCell>
    </TableRow>
  )
}