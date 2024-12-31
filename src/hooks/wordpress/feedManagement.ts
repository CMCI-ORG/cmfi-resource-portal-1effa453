import { supabase } from "@/integrations/supabase/client"
import type { ContentItem, ContentInsert } from "./types"

export const createContentSource = async (
  name: string,
  url: string,
  displaySummary: boolean
) => {
  const { data: sourceData, error: sourceError } = await supabase
    .from("content_sources")
    .insert({
      type: "wordpress",
      name,
      source_url: url,
      source_id: url,
      feed_url: url,
      display_summary: displaySummary,
      last_import_attempt: new Date().toISOString()
    })
    .select()
    .maybeSingle()

  if (sourceError) throw new Error(`Failed to add content source: ${sourceError.message}`)
  if (!sourceData) throw new Error("Failed to create content source")

  return sourceData
}

export const checkRateLimit = async (sourceId: string) => {
  const { data: isAllowed, error: rateLimitError } = await supabase
    .rpc('check_import_rate_limit', { source_id: sourceId })

  if (rateLimitError) throw new Error("Failed to check rate limit: " + rateLimitError.message)
  if (!isAllowed) {
    throw new Error("Rate limit exceeded. Please wait 15 minutes between imports.")
  }
}

export const parseFeed = async (url: string, sourceId: string, displaySummary: boolean) => {
  const { data: feedData, error: feedError } = await supabase.functions.invoke(
    "parse-wordpress-feed",
    {
      body: { 
        url,
        sourceId,
        displaySummary 
      }
    }
  )

  if (feedError) throw feedError
  if (!feedData?.items) throw new Error("No articles found in feed")

  return feedData.items
}

export const insertContent = async (items: ContentItem[], sourceName: string) => {
  const contentToInsert: ContentInsert[] = items.map(item => ({
    type: "blog",
    title: item.title,
    description: item.description,
    content_url: item.link,
    thumbnail_url: item.thumbnail,
    source: sourceName,
    published_at: item.pubDate,
    external_id: item.guid,
    metadata: {
      categories: item.categories,
      tags: item.tags,
      author: item.author,
    },
  }))

  const { error: insertError } = await supabase
    .from("content")
    .upsert(contentToInsert)

  if (insertError) throw insertError
}

export const fetchExistingSources = async () => {
  const { data, error } = await supabase
    .from("content_sources")
    .select("*")
    .eq("type", "wordpress")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching sources:", error)
    return []
  }

  return data || []
}

export const deleteSource = async (sourceId: string) => {
  const { error } = await supabase
    .from("content_sources")
    .delete()
    .eq("id", sourceId)

  if (error) throw error
}