import { serve } from "https://deno.fresh.dev/std@v9.6.1/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts"

serve(async (req) => {
  try {
    const url = new URL(req.url).searchParams.get("url")
    if (!url) {
      return new Response(JSON.stringify({ error: "No URL provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

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

    return new Response(JSON.stringify({ items }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to parse feed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
})