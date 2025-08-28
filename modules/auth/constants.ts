// Auth module constants

export const AUTH_CONSTANTS = {
  // Password settings
  PASSWORD: {
    MIN_LENGTH: 8,
    SALT_ROUNDS: 12,
  },

  // Token settings
  TOKENS: {
    VERIFICATION_EXPIRES: 24 * 60 * 60 * 1000, // 24 hours
    RESET_PASSWORD_EXPIRES: 60 * 60 * 1000, // 1 hour
    SESSION_MAX_AGE: 30 * 24 * 60 * 60, // 30 days in seconds
  },

  // Rate limiting
  RATE_LIMITS: {
    LOGIN_ATTEMPTS: 5,
    RESET_PASSWORD_REQUESTS: 3,
    VERIFICATION_EMAILS: 3,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  },

  // Email templates
  EMAIL_TEMPLATES: {
    VERIFICATION: 'email-verification',
    RESET_PASSWORD: 'reset-password',
    WELCOME: 'welcome',
    PASSWORD_CHANGED: 'password-changed',
  },

  // Error messages
  ERRORS: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_NOT_FOUND: 'User not found',
    USER_ALREADY_EXISTS: 'User already exists with this email',
    EMAIL_NOT_VERIFIED: 'Please verify your email before signing in',
    INVALID_TOKEN: 'Invalid or expired token',
    PASSWORD_MISMATCH: 'Passwords do not match',
    WEAK_PASSWORD: 'Password does not meet security requirements',
    RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',
    UNAUTHORIZED: 'You are not authorized to perform this action',
  },

  // Success messages
  SUCCESS: {
    REGISTRATION: 'Account created successfully. Please check your email to verify your account.',
    EMAIL_VERIFIED: 'Email verified successfully. You can now sign in.',
    PASSWORD_RESET_SENT: 'Password reset link sent to your email.',
    PASSWORD_RESET: 'Password reset successfully. You can now sign in with your new password.',
    PASSWORD_CHANGED: 'Password changed successfully.',
    VERIFICATION_SENT: 'Verification email sent successfully.',
  },

  // Provider names
  PROVIDERS: {
    GOOGLE: 'google',
    EMAIL: 'email',
    CREDENTIALS: 'credentials',
  },

  // User roles (if needed for RBAC)
  ROLES: {
    USER: 'user',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
  },

  // Account status
  ACCOUNT_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    PENDING_VERIFICATION: 'pending_verification',
  },
} as const

// Type-safe access to constants
export type AuthProvider = typeof AUTH_CONSTANTS.PROVIDERS[keyof typeof AUTH_CONSTANTS.PROVIDERS]
export type UserRole = typeof AUTH_CONSTANTS.ROLES[keyof typeof AUTH_CONSTANTS.ROLES]
export type AccountStatus = typeof AUTH_CONSTANTS.ACCOUNT_STATUS[keyof typeof AUTH_CONSTANTS.ACCOUNT_STATUS]