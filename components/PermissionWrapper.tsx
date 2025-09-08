"use client"

import { ReactNode } from "react"
import { usePermissions } from "@/hooks/usePermissions"
import { Permission } from "@/lib/permissions"

interface PermissionWrapperProps {
  children: ReactNode
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  fallback?: ReactNode
  inverse?: boolean
}

export function PermissionWrapper({ 
  children, 
  permission, 
  permissions = [], 
  requireAll = false,
  fallback = null,
  inverse = false
}: PermissionWrapperProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()
  
  let hasAccess = false
  
  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
  } else {
    hasAccess = true // No permissions specified, allow by default
  }
  
  // Inverse the logic if needed (useful for hiding things from certain roles)
  if (inverse) {
    hasAccess = !hasAccess
  }
  
  return hasAccess ? <>{children}</> : <>{fallback}</>
}