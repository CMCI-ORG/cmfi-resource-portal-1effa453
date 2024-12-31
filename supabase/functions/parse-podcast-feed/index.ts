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

    console.log("Fetching podcast feed from:", url)
    const response = await fetch(url)
    const xmlText = await response.text()
    
    // Parse XML using deno-xml parser
    const doc = parse(xmlText)
    const channel = doc.rss?.channel
    
    if (!channel || !Array.isArray(channel.item)) {
      throw new Error("Invalid RSS feed format")
    }

    const items = channel.item.map((item: any) => ({
      title: item.title?.[0] || "",
      description: item.description?.[0] || "",
      url: item.enclosure?.[0]?.["@url"] || "",
      guid: item.guid?.[0] || "",
      pubDate: new Date(item.pubDate?.[0] || "").toISOString(),
      duration: item["itunes:duration"]?.[0] || "",
      author: item["itunes:author"]?.[0] || "",
      thumbnail: item["itunes:image"]?.[0]?.["@href"] || channel["itunes:image"]?.[0]?.["@href"] || "",
    }))

    console.log(`Successfully parsed ${items.length} episodes`)
    return new Response(
      JSON.stringify({ items }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error("Error parsing feed:", error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to parse feed" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})