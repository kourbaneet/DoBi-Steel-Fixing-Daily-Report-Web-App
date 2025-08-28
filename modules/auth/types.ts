import { User } from "@prisma/client"

// Auth-related types
export interface AuthUser {
  id: string
  email: string
  name?: string | null
  image?: string | null
  emailVerified?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface AuthResponse {
  success: boolean
  data?: {
    user: AuthUser
    token?: string
  }
  error?: {
    message: string
    code?: string
  }
  timestamp: string
}

export interface VerificationToken {
  id: string
  token: string
  email: string
  type: 'email_verification' | 'password_reset'
  expiresAt: Date
  createdAt: Date
}

export interface AuthSession {
  user: AuthUser
  expires: string
}

export interface LoginAttempt {
  email: string
  ip: string
  userAgent: string
  success: boolean
  timestamp: Date
}

export interface AuthAuditLog {
  id: string
  userId: string
  action: string
  metadata?: Record<string, any>
  ip: string
  userAgent: string
  timestamp: Date
}

// OAuth provider user info
export interface OAuthUserInfo {
  id: string
  email: string
  name?: string
  image?: string
  provider: string
  providerId: string
}

// Email templates data
export interface EmailTemplateData {
  verificationEmail: {
    name: string
    verificationUrl: string
    token: string
  }
  passwordReset: {
    name: string
    resetUrl: string
    token: string
  }
  welcome: {
    name: string
    loginUrl: string
  }
  passwordChanged: {
    name: string
    timestamp: string
  }
}