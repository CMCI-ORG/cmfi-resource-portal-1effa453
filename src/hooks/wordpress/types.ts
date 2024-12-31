export interface FeedState {
  name: string
  url: string
  displaySummary: boolean
}

export interface ContentItem {
  title: string
  description: string
  link: string
  thumbnail: string
  pubDate: string
  guid: string
  categories: string[]
  tags: string[]
  author: string
}