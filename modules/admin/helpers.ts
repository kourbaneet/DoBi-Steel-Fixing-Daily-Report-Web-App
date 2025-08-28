import { Role } from "@prisma/client"
import { AdminUser } from "./types"

export const sanitizeAdminUser = (user: any): AdminUser => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export const formatUserList = (users: any[]): AdminUser[] => {
  return users.map(sanitizeAdminUser)
}

export const getAvailableRoles = (currentRole: Role): Role[] => {
  return Object.values(Role).filter(role => role !== currentRole)
}

export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatDateOnly = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const getUserInitials = (name?: string | null): string => {
  if (!name) return "?"
  
  const names = name.split(" ")
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase()
  }
  return name.charAt(0).toUpperCase()
}

export const isRecentSignup = (createdAt: Date | string, daysThreshold: number = 7): boolean => {
  const now = new Date()
  const createdDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  const diffTime = Math.abs(now.getTime() - createdDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= daysThreshold
}

export const buildUserSearchQuery = (search: string) => {
  if (!search) return {}
  
  return {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ],
  }
}

export const buildUserFilters = (filters: {
  role?: Role
  emailVerified?: boolean
  dateFrom?: Date
  dateTo?: Date
}) => {
  const where: any = {}
  
  if (filters.role) {
    where.role = filters.role
  }
  
  if (filters.emailVerified !== undefined) {
    where.emailVerified = filters.emailVerified ? { not: null } : null
  }
  
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {}
    if (filters.dateFrom) {
      where.createdAt.gte = filters.dateFrom
    }
    if (filters.dateTo) {
      where.createdAt.lte = filters.dateTo
    }
  }
  
  return where
}