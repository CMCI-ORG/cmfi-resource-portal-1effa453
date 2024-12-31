import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { WordPressFeedForm } from "./wordpress/WordPressFeedForm"
import { WordPressFeedProgress } from "./wordpress/WordPressFeedProgress"
import { useWordPressFeedParser } from "@/hooks/useWordPressFeedParser"

export function WordPressFeedParser() {
  const {
    feeds,
    isLoading,
    progress,
    status,
    addFeed,
    removeFeed,
    updateFeed,
    updateDisplaySummary,
    parseFeeds
  } = useWordPressFeedParser()

  return (
    <ErrorBoundary>
      <Card>
        <CardHeader>
          <CardTitle>Import WordPress Blogs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <WordPressFeedForm
            feeds={feeds}
            isLoading={isLoading}
            onAddFeed={addFeed}
            onRemoveFeed={removeFeed}
            onUpdateFeed={updateFeed}
            onUpdateDisplaySummary={updateDisplaySummary}
          />
          
          <Button 
            onClick={parseFeeds} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import
          </Button>

          {isLoading && <WordPressFeedProgress progress={progress} status={status} />}
        </CardContent>
      </Card>
    </ErrorBoundary>
  )
}