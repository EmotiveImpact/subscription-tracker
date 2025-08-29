"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  CreditCard,
  Settings,
  Mail,
  PlusCircle,
  TrendingUp,
  User,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  { title: "Discoveries", href: "/discoveries", icon: TrendingUp },
  { title: "Settings", href: "/settings", icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()
  const { user, isSignedIn, logout } = useAuth()

  if (!isSignedIn) {
    return null
  }

  return (
    <div className="flex h-screen w-64 flex-col bg-background border-r border-border">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-border">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground">SubTracker</span>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.fullName || user?.primaryEmailAddress?.emailAddress}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </nav>

      {/* Quick Actions */}
      <div className="px-4 py-4 border-t border-border">
        <Link
          href="/subscriptions/new"
          className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="h-5 w-5" />
          <span>Add Subscription</span>
        </Link>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border space-y-3">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Gmail Integration</p>
            <p className="text-xs text-muted-foreground">Connected</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="w-full justify-start"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
