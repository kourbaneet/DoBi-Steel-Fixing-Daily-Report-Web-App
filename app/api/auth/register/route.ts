import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/modules/auth/services'
import { registerSchema } from '@/modules/auth/validations'
import { AUTH_CONSTANTS } from '@/modules/auth/constants'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    // Validate input with Zod
    const validation = registerSchema.safeParse({ email, password, name })
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation failed',
          fieldErrors 
        },
        { status: 400 }
      )
    }

    // Create user with email verification
    const result = await AuthService.createUser({
      email: validation.data.email,
      password: validation.data.password,
      name: validation.data.name,
      sendVerificationEmail: true
    })

    return NextResponse.json({
      success: true,
      message: AUTH_CONSTANTS.SUCCESS.REGISTRATION,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        emailVerified: result.user.emailVerified
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Registration failed'
    
    // Handle specific errors
    if (errorMessage.includes('already exists')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User already exists with this email address',
          code: 'USER_EXISTS'
        },
        { status: 409 }
      )
    }

    if (errorMessage.includes('validation')) {
      return NextResponse.json(
        { 
          success: false,
          error: errorMessage,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Registration failed. Please try again.',
        code: 'REGISTRATION_ERROR'
      },
      { status: 500 }
    )
  }
}