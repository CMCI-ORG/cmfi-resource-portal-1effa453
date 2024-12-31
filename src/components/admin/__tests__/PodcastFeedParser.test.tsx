import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { PodcastFeedParser } from "../PodcastFeedParser"
import { supabase } from "@/integrations/supabase/client"

// Mock the supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn(),
    })),
  },
}))

// Mock the toast hook
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe("PodcastFeedParser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders without crashing", () => {
    render(<PodcastFeedParser />)
    expect(screen.getByTestId("feed-url-input")).toBeInTheDocument()
    expect(screen.getByTestId("import-button")).toBeInTheDocument()
  })

  it("validates empty feed URL", async () => {
    render(<PodcastFeedParser />)
    
    fireEvent.click(screen.getByTestId("import-button"))
    
    await waitFor(() => {
      expect(supabase.functions.invoke).not.toHaveBeenCalled()
    })
  })

  it("validates invalid feed URL", async () => {
    render(<PodcastFeedParser />)
    
    const input = screen.getByTestId("feed-url-input")
    fireEvent.change(input, { target: { value: "invalid-url" } })
    fireEvent.click(screen.getByTestId("import-button"))
    
    await waitFor(() => {
      expect(supabase.functions.invoke).not.toHaveBeenCalled()
    })
  })

  it("shows progress bar and status during import", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: { items: [] },
      error: null,
    })

    render(<PodcastFeedParser />)
    
    const input = screen.getByTestId("feed-url-input")
    fireEvent.change(input, { target: { value: "https://valid-feed.com/rss" } })
    fireEvent.click(screen.getByTestId("import-button"))
    
    await waitFor(() => {
      expect(screen.getByTestId("progress-bar")).toBeInTheDocument()
      expect(screen.getByTestId("status-message")).toBeInTheDocument()
    })
  })

  it("handles successful podcast import", async () => {
    const mockItems = [{
      title: "Test Episode",
      description: "Test Description",
      url: "https://test.com/episode",
      guid: "123",
      pubDate: "2024-01-01",
      duration: "30:00",
      author: "Test Author",
      thumbnail: "https://test.com/thumb.jpg"
    }]

    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: { items: mockItems },
      error: null,
    })

    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValueOnce({ error: null }),
    } as any)

    render(<PodcastFeedParser />)
    
    const input = screen.getByTestId("feed-url-input")
    fireEvent.change(input, { target: { value: "https://valid-feed.com/rss" } })
    fireEvent.click(screen.getByTestId("import-button"))
    
    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith("parse-podcast-feed", {
        body: { url: "https://valid-feed.com/rss" }
      })
    })
  })

  it("handles edge function error", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: new Error("Edge function error")
    })

    render(<PodcastFeedParser />)
    
    const input = screen.getByTestId("feed-url-input")
    fireEvent.change(input, { target: { value: "https://valid-feed.com/rss" } })
    fireEvent.click(screen.getByTestId("import-button"))
    
    await waitFor(() => {
      expect(screen.queryByTestId("progress-bar")).not.toBeInTheDocument()
    })
  })
})