import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts"

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
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlText, "text/xml")

    if (!doc) {
      throw new Error("Failed to parse XML")
    }

    const items = Array.from(doc.getElementsByTagName("item")).map((item) => ({
      title: item.querySelector("title")?.textContent || "",
      description: item.querySelector("description")?.textContent || "",
      url: item.querySelector("enclosure")?.getAttribute("url") || "",
      guid: item.querySelector("guid")?.textContent || "",
      pubDate: new Date(item.querySelector("pubDate")?.textContent || "").toISOString(),
      duration: item.querySelector("itunes\\:duration")?.textContent || "",
      author: item.querySelector("itunes\\:author")?.textContent || "",
      thumbnail: item.querySelector("itunes\\:image")?.getAttribute("href") || "",
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