"use client"

import { ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { usePermissions } from "@/hooks/usePermissions"
import { Permission } from "@/lib/permissions"
import { toast } from "sonner"

interface ProtectedRouteProps {
  children: ReactNode
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  redirectTo?: string
  fallback?: ReactNode
}

export function ProtectedRoute({
  children,
  permission,
  permissions = [],
  requireAll = false,
  redirectTo = "/dashboard",
  fallback = null
}: ProtectedRouteProps) {
  const router = useRouter()
  const { status } = useSession()
  const { hasPermission, hasAnyPermission, hasAllPermissions, isAuthenticated } = usePermissions()

  useEffect(() => {
    if (status === "loading") return

    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    let hasAccess = true

    if (permission) {
      hasAccess = hasPermission(permission)
    } else if (permissions.length > 0) {
      hasAccess = requireAll 
        ? hasAllPermissions(permissions)
        : hasAnyPermission(permissions)
    }

    if (!hasAccess) {
      toast.error("You don't have permission to access this page")
      router.push(redirectTo)
      return
    }
  }, [status, isAuthenticated, permission, permissions, requireAll, redirectTo, router, hasPermission, hasAnyPermission, hasAllPermissions])

  if (status === "loading") {
    return <>{fallback}</>
  }

  if (!isAuthenticated) {
    return null
  }

  let hasAccess = true
  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
  }

  if (!hasAccess) {
    return null
  }

  return <>{children}</>
}