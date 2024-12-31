import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"

interface FeedFormProps {
  feeds: { name: string; url: string; displaySummary: boolean }[]
  isLoading: boolean
  onAddFeed: () => void
  onRemoveFeed: (index: number) => void
  onUpdateFeed: (index: number, field: string, value: string | boolean) => void
}

export function WordPressFeedForm({
  feeds,
  isLoading,
  onAddFeed,
  onRemoveFeed,
  onUpdateFeed,
}: FeedFormProps) {
  return (
    <div className="space-y-4">
      {feeds.map((feed, index) => (
        <div key={index} className="space-y-4 p-4 border rounded-lg">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor={`feed-name-${index}`}>Feed Name</Label>
                <Input
                  id={`feed-name-${index}`}
                  placeholder="Enter feed name"
                  value={feed.name}
                  onChange={(e) => onUpdateFeed(index, "name", e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {feeds.length > 1 && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => onRemoveFeed(index)}
                  disabled={isLoading}
                  className="mt-6"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div>
              <Label htmlFor={`feed-url-${index}`}>Feed URL</Label>
              <Input
                id={`feed-url-${index}`}
                placeholder="Enter WordPress RSS feed URL"
                value={feed.url}
                onChange={(e) => onUpdateFeed(index, "url", e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id={`display-summary-${index}`}
              checked={feed.displaySummary}
              onCheckedChange={(checked) => onUpdateFeed(index, "displaySummary", checked)}
              disabled={isLoading}
            />
            <Label htmlFor={`display-summary-${index}`}>
              Display article summary
            </Label>
          </div>
        </div>
      ))}
      
      <Button
        variant="outline"
        onClick={onAddFeed}
        disabled={isLoading}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Another Feed
      </Button>
    </div>
  )
}