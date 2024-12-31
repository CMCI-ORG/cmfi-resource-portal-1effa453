import React, { Component, ErrorInfo, ReactNode } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { RefreshCw, Wifi, AlertCircle } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  private isNetworkError = (error: Error): boolean => {
    return (
      error instanceof TypeError && 
      (error.message.includes('network') || 
       error.message.includes('failed to fetch') ||
       error.message.includes('Network request failed'))
    )
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const isNetworkError = this.state.error && this.isNetworkError(this.state.error)

      return (
        <Alert variant="destructive" className="my-4">
          <AlertTitle className="flex items-center gap-2">
            {isNetworkError ? (
              <>
                <Wifi className="h-4 w-4" />
                Network Error
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                Something went wrong
              </>
            )}
          </AlertTitle>
          <AlertDescription className="space-y-4">
            <p>
              {isNetworkError
                ? "Unable to connect to the server. Please check your internet connection."
                : "An error occurred while loading this component."}
            </p>
            {this.state.error && (
              <p className="text-sm opacity-80">
                {this.state.error.message}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="mt-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )
    }

    return this.props.children
  }
}