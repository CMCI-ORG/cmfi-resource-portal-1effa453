import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"

interface FeedFormProps {
  feeds: { url: string; displaySummary: boolean }[]
  isLoading: boolean
  onAddFeed: () => void
  onRemoveFeed: (index: number) => void
  onUpdateFeed: (index: number, url: string) => void
  onUpdateDisplaySummary: (index: number, displaySummary: boolean) => void
}

export function WordPressFeedForm({
  feeds,
  isLoading,
  onAddFeed,
  onRemoveFeed,
  onUpdateFeed,
  onUpdateDisplaySummary,
}: FeedFormProps) {
  return (
    <div className="space-y-4">
      {feeds.map((feed, index) => (
        <div key={index} className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Enter WordPress RSS feed URL"
              value={feed.url}
              onChange={(e) => onUpdateFeed(index, e.target.value)}
              className="flex-1"
              disabled={isLoading}
            />
            {feeds.length > 1 && (
              <Button
                variant="destructive"
                size="icon"
                onClick={() => onRemoveFeed(index)}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id={`display-summary-${index}`}
              checked={feed.displaySummary}
              onCheckedChange={(checked) => onUpdateDisplaySummary(index, checked)}
              disabled={isLoading}
            />
            <Label htmlFor={`display-summary-${index}`}>
              Display article summary
            </Label>
          </div>
        </div>
      ))}
      
      <div className="flex gap-4">
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
    </div>
  )
}