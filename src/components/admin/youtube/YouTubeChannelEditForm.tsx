import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { TableCell, TableRow } from "@/components/ui/table"

interface YouTubeChannelEditFormProps {
  name: string
  sourceId: string
  lastSyncedAt: string | null
  onNameChange: (value: string) => void
  onSourceIdChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
}

export function YouTubeChannelEditForm({
  name,
  sourceId,
  lastSyncedAt,
  onNameChange,
  onSourceIdChange,
  onSave,
  onCancel,
}: YouTubeChannelEditFormProps) {
  return (
    <TableRow>
      <TableCell>
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Channel name"
        />
      </TableCell>
      <TableCell>
        <Input
          value={sourceId}
          onChange={(e) => onSourceIdChange(e.target.value)}
          placeholder="Channel ID or @handle"
        />
      </TableCell>
      <TableCell>
        {lastSyncedAt
          ? new Date(lastSyncedAt).toLocaleString()
          : "Never"}
      </TableCell>
      <TableCell className="text-right">
        <div className="space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onSave}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}