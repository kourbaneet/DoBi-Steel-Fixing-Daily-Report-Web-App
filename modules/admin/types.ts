import { Role, User } from "@prisma/client"

export interface AdminUser {
  id: string
  email: string
  name?: string | null
  image?: string | null
  role: Role
  emailVerified?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface UserListResponse {
  success: boolean
  data?: {
    users: AdminUser[]
    totalCount: number
  }
  error?: {
    message: string
    code?: string
  }
  timestamp: string
}

export interface UserUpdateResponse {
  success: boolean
  data?: {
    user: AdminUser
  }
  error?: {
    message: string
    code?: string
  }
  timestamp: string
}

export interface RoleChangeRequest {
  userId: string
  role: Role
  reason?: string
}

export interface AdminAction {
  id: string
  adminId: string
  targetUserId: string
  action: 'ROLE_CHANGE' | 'USER_SUSPEND' | 'USER_ACTIVATE' | 'USER_DELETE'
  previousValue?: string
  newValue?: string
  reason?: string
  metadata?: Record<string, any>
  ip: string
  userAgent: string
  timestamp: Date
}

export interface AdminDashboardStats {
  totalUsers: number
  adminCount: number
  supervisorCount: number
  workerCount: number
  recentSignups: number
  pendingVerifications: number
}

export interface UserFilters {
  role?: Role
  emailVerified?: boolean
  search?: string
  dateFrom?: Date
  dateTo?: Date
}

export interface PaginationOptions {
  page: number
  limit: number
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'email'
  sortOrder?: 'asc' | 'desc'
}