import { Role } from "@prisma/client"

export type Permission = 
  | "builders.view"
  | "builders.create"
  | "builders.edit"
  | "builders.delete"
  | "builders.locations.create"
  | "builders.locations.edit"
  | "builders.locations.delete"
  | "contractors.view"
  | "contractors.create"
  | "contractors.edit"
  | "contractors.delete"
  | "admin.access"
  | "users.manage"

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "builders.view",
    "builders.create", 
    "builders.edit",
    "builders.delete",
    "builders.locations.create",
    "builders.locations.edit", 
    "builders.locations.delete",
    "contractors.view",
    "contractors.create",
    "contractors.edit", 
    "contractors.delete",
    "admin.access",
    "users.manage"
  ],
  SUPERVISOR: [
    "builders.view",
    "contractors.view"
  ],
  WORKER: []
}

export function hasPermission(userRole: Role | undefined, permission: Permission): boolean {
  if (!userRole) return false
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false
}

export function hasAnyPermission(userRole: Role | undefined, permissions: Permission[]): boolean {
  if (!userRole) return false
  return permissions.some(permission => hasPermission(userRole, permission))
}

export function hasAllPermissions(userRole: Role | undefined, permissions: Permission[]): boolean {
  if (!userRole) return false
  return permissions.every(permission => hasPermission(userRole, permission))
}