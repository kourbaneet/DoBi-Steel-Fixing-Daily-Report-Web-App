import bcrypt from 'bcryptjs'
import { AUTH_CONSTANTS } from './constants'

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, AUTH_CONSTANTS.PASSWORD.SALT_ROUNDS)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

/**
 * Generate a random token for email verification or password reset
 */
export function generateToken(): string {
  const crypto = require('crypto')
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Check if a token has expired
 */
export function isTokenExpired(createdAt: Date, expiresInMs: number): boolean {
  const now = new Date()
  const expirationTime = new Date(createdAt.getTime() + expiresInMs)
  return now > expirationTime
}

/**
 * Generate a secure verification code (6 digits)
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Sanitize user data for public display (remove sensitive fields)
 */
export function sanitizeUser(user: any) {
  const { password, ...sanitizedUser } = user
  return sanitizedUser
}

/**
 * Create a user-friendly error message
 */
export function createAuthError(message: string, code?: string) {
  return {
    message,
    code,
    timestamp: new Date().toISOString()
  }
}

/**
 * Validate email domain against a whitelist (if needed)
 */
export function isEmailDomainAllowed(email: string, allowedDomains?: string[]): boolean {
  if (!allowedDomains || allowedDomains.length === 0) {
    return true
  }
  
  const domain = email.split('@')[1]?.toLowerCase()
  return allowedDomains.some(allowedDomain => 
    domain === allowedDomain.toLowerCase()
  )
}

/**
 * Generate a temporary password for OAuth users
 */
export function generateTempPassword(): string {
  const crypto = require('crypto')
  return crypto.randomBytes(16).toString('hex')
}

/**
 * Check if user needs to set up 2FA (future feature)
 */
export function should2FABeRequired(user: any): boolean {
  // This can be expanded based on user role, account age, etc.
  return false
}

/**
 * Format auth response for API consistency
 */
export function formatAuthResponse(user: any, token?: string) {
  return {
    success: true,
    data: {
      user: sanitizeUser(user),
      ...(token && { token })
    },
    timestamp: new Date().toISOString()
  }
}

/**
 * Create audit log entry for auth events
 */
export function createAuthAuditLog(
  userId: string,
  action: string,
  metadata?: Record<string, any>
) {
  return {
    userId,
    action,
    metadata,
    timestamp: new Date(),
    ip: metadata?.ip || 'unknown',
    userAgent: metadata?.userAgent || 'unknown'
  }
}