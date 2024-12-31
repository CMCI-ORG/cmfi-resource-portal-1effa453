import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { WordPressFeedForm } from "./wordpress/WordPressFeedForm"
import { useWordPressFeedParser } from "@/hooks/useWordPressFeedParser"

interface WordPressFeedParserProps {
  onSuccess?: () => void
}

export function WordPressFeedParser({ onSuccess }: WordPressFeedParserProps) {
  const {
    feeds,
    isLoading,
    progress,
    status,
    error,
    addFeed,
    removeFeed,
    updateFeed,
    parseFeeds
  } = useWordPressFeedParser({ onSuccess })

  const handleSubmit = async () => {
    await parseFeeds()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import WordPress Blogs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <WordPressFeedForm
          feeds={feeds}
          isLoading={isLoading}
          error={error}
          onAddFeed={addFeed}
          onRemoveFeed={removeFeed}
          onUpdateFeed={updateFeed}
        />
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        {isLoading && (
          <div className="w-full space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-center text-muted-foreground">{status}</p>
          </div>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full"
        >
          Import
        </Button>
      </CardFooter>
    </Card>
  )
}