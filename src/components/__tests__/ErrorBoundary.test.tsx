import { render, screen, fireEvent } from "@testing-library/react"
import { ErrorBoundary } from "../ErrorBoundary"

const ThrowError = () => {
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

  it("renders error UI when there's an error", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    expect(screen.getByText("An error occurred while loading this component.")).toBeInTheDocument()
  })

  it("renders custom fallback when provided", () => {
    const fallback = <div>Custom error message</div>
    render(
      <ErrorBoundary fallback={fallback}>
        <ThrowError />
      </ErrorBoundary>
    )
    expect(screen.getByText("Custom error message")).toBeInTheDocument()
  })

  it("resets error state when try again button is clicked", () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
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