import type { Database } from "@/integrations/supabase/types"

export interface FeedState {
  name: string
  url: string
  displaySummary: boolean
}

export type ContentType = Database["public"]["Enums"]["content_type"]

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

export interface ContentInsert {
  type: ContentType
  title: string
  description: string
  content_url: string
  thumbnail_url: string
  source: string
  published_at: string
  external_id: string
  metadata: {
    categories: string[]
    tags: string[]
    author: string
  }
}