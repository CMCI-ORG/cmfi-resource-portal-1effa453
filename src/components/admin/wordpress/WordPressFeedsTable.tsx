import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface WordPressFeedsTableProps {
  feeds: any[]
  onDelete: (id: string) => void
  onRefresh: (id: string) => void
  isLoading?: boolean
}

export function WordPressFeedsTable({ 
  feeds, 
  onDelete,
  onRefresh,
  isLoading 
}: WordPressFeedsTableProps) {
  const { toast } = useToast()

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id)
      toast({
        title: "Success",
        description: "Feed deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete feed",
        variant: "destructive",
      })
    }
  }

  const handleRefresh = async (id: string) => {
    try {
      await onRefresh(id)
      toast({
        title: "Success",
        description: "Feed refreshed successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh feed",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Last Import</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feeds.map((feed) => (
            <TableRow key={feed.id}>
              <TableCell>{feed.name}</TableCell>
              <TableCell className="font-mono text-sm">
                {feed.feed_url}
              </TableCell>
              <TableCell>
                {feed.last_synced_at 
                  ? formatDistanceToNow(new Date(feed.last_synced_at), { addSuffix: true })
                  : 'Never'
                }
              </TableCell>
              <TableCell>
                {feed.last_import_attempt
                  ? formatDistanceToNow(new Date(feed.last_import_attempt), { addSuffix: true })
                  : 'Never'
                }
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRefresh(feed.id)}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(feed.id)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {feeds.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No feeds found. Add a feed using the form above.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}