import * as React from "react"
import { Loader2 } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const loadingVariants = cva("animate-spin", {
  variants: {
    size: {
      sm: "h-4 w-4",
      default: "h-6 w-6",
      lg: "h-8 w-8",
      xl: "h-12 w-12",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

interface LoadingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {
  text?: string
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, size, text, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center gap-2", className)}
        {...props}
      >
        <Loader2 className={cn(loadingVariants({ size }))} />
        {text && <span className="text-sm text-muted-foreground">{text}</span>}
      </div>
    )
  }
)
Loading.displayName = "Loading"

const LoadingScreen = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { text?: string }
>(({ className, text = "Loading...", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex h-screen w-full items-center justify-center",
        className
      )}
      {...props}
    >
      <Loading size="xl" text={text} />
    </div>
  )
})
LoadingScreen.displayName = "LoadingScreen"

const LoadingButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean
    loadingText?: string
  }
>(({ className, children, loading, loadingText, disabled, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={className}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText || "Loading..."}
        </div>
      ) : (
        children
      )}
    </button>
  )
})
LoadingButton.displayName = "LoadingButton"

export { Loading, LoadingScreen, LoadingButton, loadingVariants }

