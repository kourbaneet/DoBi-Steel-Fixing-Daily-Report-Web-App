import { PRISMA } from "@/libs/prisma"
import { Role } from '@prisma/client'
import { hashPassword, verifyPassword, generateToken, isTokenExpired, sanitizeUser } from './helpers'
import { AUTH_CONSTANTS } from './constants'
import { RegisterInput, LoginInput, ChangePasswordInput, registerSchema, loginSchema } from './validations'
import { EmailService } from '@/libs/resend/email'

export class AuthService {
  /**
   * Create a new user with email and password
   */
  static async createUser(userData: RegisterInput & { sendVerificationEmail?: boolean }) {
    // Validate input data with Zod schema
    const validatedData = registerSchema.parse({
      email: userData.email,
      password: userData.password,
      name: userData.name
    })

    const { email, password, name } = validatedData
    const { sendVerificationEmail = false } = userData

    // Check if user already exists
    const existingUser = await PRISMA.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new Error(AUTH_CONSTANTS.ERRORS.USER_ALREADY_EXISTS)
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user without email verification first
    const newUser = await PRISMA.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: Role.WORKER, // Default role for new signups
        emailVerified: sendVerificationEmail ? null : new Date(), // null = needs verification
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      }
    })

    // Handle email verification using NextAuth's system
    let verificationToken: string | null = null

    if (sendVerificationEmail) {
      verificationToken = generateToken()

      // Store verification token using NextAuth's VerificationToken table
      await PRISMA.verificationToken.create({
        data: {
          identifier: email,
          token: verificationToken,
          expires: new Date(Date.now() + AUTH_CONSTANTS.TOKENS.VERIFICATION_EXPIRES)
        }
      })

      // Send verification email
      try {
        await EmailService.sendVerificationEmail(email, verificationToken)
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError)
        // Still return success since user was created, just email failed
      }
    }

    return {
      user: newUser,
      verificationToken
    }
  }

  /**
   * Authenticate user with email and password
   */
  static async authenticateUser(credentials: LoginInput) {
    // Validate input data with Zod schema
    const validatedData = loginSchema.parse({
      email: credentials.email,
      password: credentials.password
    })

    const { email, password } = validatedData

    // Find user by email
    const user = await PRISMA.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        password: true,
        role: true,
        emailVerified: true,
      }
    })

    if (!user || !user.password) {
      throw new Error(AUTH_CONSTANTS.ERRORS.INVALID_CREDENTIALS)
    }

    // Check if email is verified (optional - remove if you don't want this requirement)
    if (!user.emailVerified) {
      throw new Error(AUTH_CONSTANTS.ERRORS.EMAIL_NOT_VERIFIED)
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password)
    if (!isPasswordValid) {
      throw new Error(AUTH_CONSTANTS.ERRORS.INVALID_CREDENTIALS)
    }

    // Return user without password
    return sanitizeUser(user)
  }

  /**
   * Find user by email
   */
  static async findUserByEmail(email: string) {
    return await PRISMA.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      }
    })
  }

  /**
   * Find user by ID
   */
  static async findUserById(id: string) {
    return await PRISMA.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      }
    })
  }

  /**
   * Update user profile
   */
  static async updateUser(id: string, data: { name?: string; image?: string }) {
    return await PRISMA.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        updatedAt: true,
      }
    })
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, passwordData: ChangePasswordInput) {
    const { currentPassword, newPassword } = passwordData

    // Get current user with password
    const user = await PRISMA.user.findUnique({
      where: { id: userId },
      select: {
        password: true,
      }
    })

    if (!user || !user.password) {
      throw new Error(AUTH_CONSTANTS.ERRORS.USER_NOT_FOUND)
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect')
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword)

    // Update password
    await PRISMA.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
      }
    })

    return { success: true, message: AUTH_CONSTANTS.SUCCESS.PASSWORD_CHANGED }
  }

  /**
   * Initiate password reset process
   */
  static async initiatePasswordReset(email: string) {
    const user = await PRISMA.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Don't reveal if user exists or not for security
      return { success: true, message: AUTH_CONSTANTS.SUCCESS.PASSWORD_RESET_SENT }
    }

    const resetToken = generateToken()

    // Store reset token using NextAuth's VerificationToken table
    await PRISMA.verificationToken.create({
      data: {
        identifier: email,
        token: resetToken,
        expires: new Date(Date.now() + AUTH_CONSTANTS.TOKENS.RESET_PASSWORD_EXPIRES)
      }
    })

    // Send password reset email
    try {
      await EmailService.sendPasswordResetEmail(email, resetToken)
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      // Still return success since token was created, just email failed
    }

    return { success: true, message: AUTH_CONSTANTS.SUCCESS.PASSWORD_RESET_SENT }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token: string, newPassword: string) {
    console.log({token});

    // Find reset token in NextAuth's table
    const resetToken = await PRISMA.verificationToken.findUnique({
      where: { token }
    })

    if (!resetToken) {
      throw new Error(AUTH_CONSTANTS.ERRORS.INVALID_TOKEN)
    }

    // Check if token is expired
    if (new Date() > resetToken.expires) {
      // Clean up expired token
      await PRISMA.verificationToken.delete({
        where: { token }
      })
      throw new Error(AUTH_CONSTANTS.ERRORS.INVALID_TOKEN)
    }

    // Find user by email from token
    const user = await PRISMA.user.findUnique({
      where: { email: resetToken.identifier }
    })

    if (!user) {
      throw new Error(AUTH_CONSTANTS.ERRORS.USER_NOT_FOUND)
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update user's password
    await PRISMA.user.update({
      where: { email: resetToken.identifier },
      data: { password: hashedPassword }
    })

    // Remove the used reset token
    await PRISMA.verificationToken.delete({
      where: { token }
    })

    // Send password changed notification email
    try {
      await EmailService.sendPasswordChangedEmail(user.email, user.name)
    } catch (emailError) {
      console.error('Failed to send password changed notification:', emailError)
      // Don't fail password reset if notification email fails
    }

    return {
      success: true,
      message: AUTH_CONSTANTS.SUCCESS.PASSWORD_RESET
    }
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(token: string) {
    // Find verification token in NextAuth's table
    const verificationToken = await PRISMA.verificationToken.findUnique({
      where: { token }
    })

    if (!verificationToken) {
      throw new Error(AUTH_CONSTANTS.ERRORS.INVALID_TOKEN)
    }

    // Check if token is expired
    if (new Date() > verificationToken.expires) {
      // Clean up expired token
      await PRISMA.verificationToken.delete({
        where: { token }
      })
      throw new Error(AUTH_CONSTANTS.ERRORS.INVALID_TOKEN)
    }

    // Find user by email
    const user = await PRISMA.user.findUnique({
      where: { email: verificationToken.identifier }
    })

    if (!user) {
      throw new Error(AUTH_CONSTANTS.ERRORS.USER_NOT_FOUND)
    }

    // Update user's emailVerified field
    const updatedUser = await PRISMA.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
      }
    })

    // Remove the used verification token
    await PRISMA.verificationToken.delete({
      where: { token }
    })

    // Send welcome email
    try {
      await EmailService.sendWelcomeEmail(updatedUser.email, updatedUser.name)
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail verification if welcome email fails
    }

    return {
      success: true,
      user: updatedUser,
      message: AUTH_CONSTANTS.SUCCESS.EMAIL_VERIFIED
    }
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(email: string) {
    const user = await PRISMA.user.findUnique({
      where: { email }
    })

    if (!user) {
      throw new Error(AUTH_CONSTANTS.ERRORS.USER_NOT_FOUND)
    }

    if (user.emailVerified) {
      throw new Error('Email is already verified')
    }

    const verificationToken = generateToken()

    // TODO: Store new verification token
    // TODO: Send verification email
    // await EmailService.sendVerificationEmail(email, verificationToken)

    return { success: true, message: AUTH_CONSTANTS.SUCCESS.VERIFICATION_SENT }
  }
}