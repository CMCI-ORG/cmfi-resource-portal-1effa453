import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { WordPressFeedParser } from "../WordPressFeedParser"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

// Mock hooks
vi.mock("@/hooks/use-toast", () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}))

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
  const mockToast = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    // Fix: Use proper type assertion for vitest mock
    ;(useToast as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      toast: mockToast,
    }))
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
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Success",
        description: "WordPress feeds parsed and articles imported successfully",
      }))
    })
  })

  it("displays error message for invalid URL", async () => {
    render(<WordPressFeedParser />)
    
    const urlInput = screen.getByLabelText(/Feed URL/i)
    const importButton = screen.getByText("Import")

    fireEvent.change(urlInput, { target: { value: "invalid-url" } })
    fireEvent.click(importButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Error",
        description: "Please enter valid feed names and URLs",
        variant: "destructive",
      }))
    })
  })

  it("shows loading state during import", async () => {
    render(<WordPressFeedParser />)
    
    const nameInput = screen.getByLabelText(/Feed Name/i)
    const urlInput = screen.getByLabelText(/Feed URL/i)
    const importButton = screen.getByText("Import")

    fireEvent.change(nameInput, { target: { value: "Test Blog" } })
    fireEvent.change(urlInput, { target: { value: "https://test.com/feed" } })
    fireEvent.click(importButton)

    expect(screen.getByText(/Initializing feed parser/i)).toBeInTheDocument()
    expect(importButton).toBeDisabled()
  })

  it("handles display summary toggle", () => {
    render(<WordPressFeedParser />)
    
    const toggle = screen.getByRole("switch")
    expect(toggle).toBeChecked()
    
    fireEvent.click(toggle)
    expect(toggle).not.toBeChecked()
  })
})