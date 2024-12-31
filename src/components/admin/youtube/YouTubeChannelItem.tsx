import { useState } from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { YouTubeChannelActions } from "./YouTubeChannelActions"
import { YouTubeChannelEditForm } from "./YouTubeChannelEditForm"

interface Channel {
  id: string
  name: string
  source_id: string
  last_synced_at: string | null
  location: string | null
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
      <YouTubeChannelEditForm
        name={editedName}
        sourceId={editedSourceId}
        location={channel.location}
        lastSyncedAt={channel.last_synced_at}
        onNameChange={setEditedName}
        onSourceIdChange={setEditedSourceId}
        onSave={handleSave}
        onCancel={onCancelEdit}
      />
    )
  }

  return (
    <TableRow>
      <TableCell>{channel.name}</TableCell>
      <TableCell>{channel.source_id}</TableCell>
      <TableCell>{channel.location || "Not available"}</TableCell>
      <TableCell>
        {channel.last_synced_at
          ? new Date(channel.last_synced_at).toLocaleString()
          : "Never"}
      </TableCell>
      <TableCell className="text-right">
        <YouTubeChannelActions
          onSync={() => onSync(channel)}
          onStartEdit={onStartEdit}
          onDelete={() => onDelete(channel.id)}
          isSyncing={isSyncing}
        />
      </TableCell>
    </TableRow>
  )
}