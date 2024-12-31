export const validateFeedUrl = (url: string): boolean => {
  try {
    new URL(url)
    return url.startsWith('http') || url.startsWith('https')
  } catch {
    return false
  }
}

export const validateFeedName = (name: string): boolean => {
  return name.trim().length >= 3 && name.trim().length <= 50
}

export const validateFeeds = (
  feeds: { name: string; url: string }[], 
  existingSources: { feed_url: string }[]
): string | null => {
  for (const feed of feeds) {
    if (!validateFeedName(feed.name)) {
      return "Feed names must be between 3 and 50 characters"
    }
    if (!validateFeedUrl(feed.url)) {
      return "Please enter valid feed URLs (must start with http:// or https://)"
    }
    if (existingSources.some(source => source.feed_url === feed.url)) {
      return "One or more feeds have already been imported"
    }
  }
  return null
}