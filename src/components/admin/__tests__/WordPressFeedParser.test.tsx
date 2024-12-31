import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { WordPressFeedParser } from "../WordPressFeedParser"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Mock } from "vitest"

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
      delete: vi.fn().mockResolvedValue({ error: null }),
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
    ;(useToast as unknown as Mock).mockImplementation(() => ({
      toast: mockToast,
    }))
  })

  it("renders feed form correctly", () => {
    render(<WordPressFeedParser />)
    expect(screen.getByText("Import WordPress Blogs")).toBeInTheDocument()
  })

  it("validates feed name length", async () => {
    render(<WordPressFeedParser />)
    
    const nameInput = screen.getByLabelText(/Feed Name/i)
    const importButton = screen.getByText("Import")

    fireEvent.change(nameInput, { target: { value: "ab" } })
    fireEvent.click(importButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Validation Error",
        description: "Feed names must be between 3 and 50 characters",
        variant: "destructive",
      }))
    })
  })

  it("validates feed URL format", async () => {
    render(<WordPressFeedParser />)
    
    const nameInput = screen.getByLabelText(/Feed Name/i)
    const urlInput = screen.getByLabelText(/Feed URL/i)
    const importButton = screen.getByText("Import")

    fireEvent.change(nameInput, { target: { value: "Test Blog" } })
    fireEvent.change(urlInput, { target: { value: "invalid-url" } })
    fireEvent.click(importButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Validation Error",
        description: "Please enter valid feed URLs (must start with http:// or https://)",
        variant: "destructive",
      }))
    })
  })

  it("handles successful feed submission", async () => {
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

  it("displays loading state during import", async () => {
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
})