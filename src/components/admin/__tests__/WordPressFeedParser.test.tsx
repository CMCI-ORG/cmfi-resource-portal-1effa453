import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { WordPressFeedParser } from "../WordPressFeedParser"
import { supabase } from "@/integrations/supabase/client"

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { items: [] }, error: null }),
    },
    auth: {
      getUser: vi.fn().mockResolvedValue({ 
        data: { user: { id: "test-user-id" } }, 
        error: null 
      }),
    },
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
  },
}))

describe("WordPressFeedParser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders feed form correctly", () => {
    render(<WordPressFeedParser />)
    expect(screen.getByText("Import WordPress Blogs")).toBeInTheDocument()
  })

  it("handles feed submission", async () => {
    render(<WordPressFeedParser />)
    
    const nameInput = screen.getByLabelText(/Feed Name/i)
    const urlInput = screen.getByLabelText(/Feed URL/i)
    const importButton = screen.getByText("Import")

    fireEvent.change(nameInput, { target: { value: "Test Blog" } })
    fireEvent.change(urlInput, { target: { value: "https://test.com/feed" } })
    fireEvent.click(importButton)

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("content_sources")
    })
  })

  it("displays error message for invalid URL", async () => {
    render(<WordPressFeedParser />)
    
    const urlInput = screen.getByLabelText(/Feed URL/i)
    const importButton = screen.getByText("Import")

    fireEvent.change(urlInput, { target: { value: "invalid-url" } })
    fireEvent.click(importButton)

    expect(await screen.findByText(/Please enter valid feed/i)).toBeInTheDocument()
  })
})