import { Resend } from 'resend'
import config from '@/config'
import { getVerificationTemplate } from './templates/verification'
import { getPasswordResetTemplate } from './templates/password-reset'
import { getWelcomeTemplate } from './templates/welcome'
import { getPasswordChangedTemplate } from './templates/password-changed'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

export class EmailService {
  /**
   * Send email verification link
   */
  static async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${config.domainName}/auth/verify-email?token=${token}`
    
    try {
      const { data, error } = await resend.emails.send({
        from: config.resend.fromNoReply,
        to: email,
        subject: 'Verify your email address',
        html: getVerificationTemplate(verificationUrl)
      })

      if (error) {
        console.error('Email verification send error:', error)
        throw new Error('Failed to send verification email')
      }

      return { success: true, messageId: data?.id }
    } catch (error) {
      console.error('Email verification send error:', error)
      throw new Error('Failed to send verification email')
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${config.domainName}/auth/reset-password?token=${token}`
    
    try {
      const { data, error } = await resend.emails.send({
        from: config.resend.fromNoReply,
        to: email,
        subject: 'Reset your password',
        html: getPasswordResetTemplate(resetUrl)
      })

      if (error) {
        console.error('Password reset email send error:', error)
        throw new Error('Failed to send password reset email')
      }

      return { success: true, messageId: data?.id }
    } catch (error) {
      console.error('Password reset email send error:', error)
      throw new Error('Failed to send password reset email')
    }
  }

  /**
   * Send welcome email after successful verification
   */
  static async sendWelcomeEmail(email: string, name?: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: config.resend.fromNoReply,
        to: email,
        subject: `Welcome to ${config.appName}!`,
        html: getWelcomeTemplate(name || 'there')
      })

      if (error) {
        console.error('Welcome email send error:', error)
        throw new Error('Failed to send welcome email')
      }

      return { success: true, messageId: data?.id }
    } catch (error) {
      console.error('Welcome email send error:', error)
      throw new Error('Failed to send welcome email')
    }
  }

  /**
   * Send password changed notification
   */
  static async sendPasswordChangedEmail(email: string, name?: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: config.resend.fromNoReply,
        to: email,
        subject: 'Password changed successfully',
        html: getPasswordChangedTemplate(name || 'there')
      })

      if (error) {
        console.error('Password changed email send error:', error)
        // Don't throw error for notification emails
        return { success: false }
      }

      return { success: true, messageId: data?.id }
    } catch (error) {
      console.error('Password changed email send error:', error)
      return { success: false }
    }
  }

}