import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { parse } from "https://deno.land/x/xml@2.1.1/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: "No URL provided" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!url.startsWith('http')) {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log("Fetching podcast feed from:", url)
    
    // Reduce timeout to 5 seconds to prevent function timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    
    try {
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/xml, text/xml, */*',
          'User-Agent': 'Podcast-Feed-Parser/1.0'
        }
      })
      
      clearTimeout(timeout)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`)
      }
      
      const xmlText = await response.text()
      
      // Stricter size limit (500KB)
      if (xmlText.length > 500000) {
        throw new Error("Feed too large: Maximum size is 500KB")
      }

      // Basic XML validation
      if (!xmlText.includes('<rss') && !xmlText.includes('<feed')) {
        throw new Error("Invalid feed format: Not a valid RSS/XML feed")
      }
      
      console.log("Parsing XML feed...")
      const doc = parse(xmlText)
      
      if (!doc.rss) {
        throw new Error("Invalid RSS feed format: Missing RSS element")
      }

      const channel = doc.rss.channel
      if (!channel || !Array.isArray(channel.item)) {
        throw new Error("Invalid RSS feed format: Missing channel or items")
      }

      // Process only the first 10 items to reduce memory usage
      const items = channel.item.slice(0, 10).map((item: any) => {
        const title = item.title?.[0] || ""
        console.log("Processing item:", title)
        
        return {
          title,
          description: item.description?.[0]?.slice(0, 1000) || "", // Limit description length
          url: item.enclosure?.[0]?.["@url"] || "",
          guid: item.guid?.[0] || "",
          pubDate: new Date(item.pubDate?.[0] || "").toISOString(),
          duration: item["itunes:duration"]?.[0] || "",
          author: item["itunes:author"]?.[0] || "",
          thumbnail: item["itunes:image"]?.[0]?.["@href"] || channel["itunes:image"]?.[0]?.["@href"] || "",
        }
      })

      console.log(`Successfully parsed ${items.length} episodes`)
      return new Response(
        JSON.stringify({ items }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Feed fetch timeout: Request took too long')
      }
      throw error
    }
  } catch (error) {
    console.error("Error parsing feed:", error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to parse feed" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})