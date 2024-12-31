import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ErrorBoundary } from "../ErrorBoundary"

const NetworkError = () => {
  throw new TypeError("Failed to fetch")
}

const GenericError = () => {
  throw new Error("Test error")
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders children when there's no error", () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText("Test content")).toBeInTheDocument()
  })

  it("renders error UI when there's a generic error", () => {
    render(
      <ErrorBoundary>
        <GenericError />
      </ErrorBoundary>
    )
    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    expect(screen.getByText("An error occurred while loading this component.")).toBeInTheDocument()
    expect(screen.getByText("Test error")).toBeInTheDocument()
  })

  it("renders network error UI when there's a network error", () => {
    render(
      <ErrorBoundary>
        <NetworkError />
      </ErrorBoundary>
    )
    expect(screen.getByText("Network Error")).toBeInTheDocument()
    expect(screen.getByText("Unable to connect to the server. Please check your internet connection.")).toBeInTheDocument()
    expect(screen.getByText("Failed to fetch")).toBeInTheDocument()
  })

  it("renders custom fallback when provided", () => {
    const fallback = <div>Custom error message</div>
    render(
      <ErrorBoundary fallback={fallback}>
        <GenericError />
      </ErrorBoundary>
    )
    expect(screen.getByText("Custom error message")).toBeInTheDocument()
  })

  it("resets error state when try again button is clicked", () => {
    const { rerender } = render(
      <ErrorBoundary>
        <GenericError />
      </ErrorBoundary>
    )
    
    const tryAgainButton = screen.getByText("Try Again")
    fireEvent.click(tryAgainButton)
    
    rerender(
      <ErrorBoundary>
        <div>Recovered content</div>
      </ErrorBoundary>
    )
    
    expect(screen.getByText("Recovered content")).toBeInTheDocument()
  })
})