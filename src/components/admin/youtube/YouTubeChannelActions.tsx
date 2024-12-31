import { Button } from "@/components/ui/button"
import { RefreshCw, Edit, Trash } from "lucide-react"

interface YouTubeChannelActionsProps {
  onSync: () => void
  onStartEdit: () => void
  onDelete: () => void
  isSyncing: boolean
}

export function YouTubeChannelActions({
  onSync,
  onStartEdit,
  onDelete,
  isSyncing,
}: YouTubeChannelActionsProps) {
  return (
    <div className="space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onSync}
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
        onClick={onDelete}
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  )
}