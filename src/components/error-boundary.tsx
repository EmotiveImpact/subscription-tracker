"use client"

import * as React from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorFallbackProps {
  error?: Error
  resetError: () => void
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError 
}) => (
  <div className="flex min-h-[400px] w-full flex-col items-center justify-center space-y-4 p-8">
    <div className="flex items-center space-x-2 text-destructive">
      <AlertTriangle className="h-8 w-8" />
      <h2 className="text-xl font-semibold">Something went wrong</h2>
    </div>
    
    <div className="max-w-md text-center">
      <p className="text-sm text-muted-foreground">
        We&apos;re sorry, but something unexpected happened. Please try refreshing 
        the page or contact support if the problem persists.
      </p>
    </div>

    {process.env.NODE_ENV === "development" && error && (
      <details className="max-w-2xl">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
          Error Details (Development Only)
        </summary>
        <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-4 text-xs text-muted-foreground">
          {error.message}
          {error.stack}
        </pre>
      </details>
    )}

    <Button
      onClick={resetError}
      variant="outline"
      size="sm"
      className="mt-4"
    >
      <RefreshCw className="mr-2 h-4 w-4" />
      Try Again
    </Button>
  </div>
)

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error Boundary caught an error:", error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
        />
      )
    }

    return this.props.children
  }
}

// Hook for functional components error handling
export function useErrorHandler() {
  return React.useCallback((error: Error) => {
    console.error("Error caught by useErrorHandler:", error)
    // In a real app, you might want to send this to an error reporting service
    throw error
  }, [])
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorFallbackProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export { ErrorBoundary, DefaultErrorFallback }
export type { ErrorBoundaryProps, ErrorFallbackProps }
