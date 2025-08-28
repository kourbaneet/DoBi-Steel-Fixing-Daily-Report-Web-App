import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/modules/auth/services'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Verify the email token
    await AuthService.verifyEmail(token)

    // Redirect to verification success page
    return NextResponse.redirect(new URL('/auth/verify-email?verified=true', request.url))
    
  } catch (error) {
    console.error('Email verification error:', error)
    
    // Redirect to error page with error message
    const errorMessage = error instanceof Error ? error.message : 'Verification failed'
    return NextResponse.redirect(
      new URL(`/auth/error?error=verification&message=${encodeURIComponent(errorMessage)}`, request.url)
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Verify the email token
    const result = await AuthService.verifyEmail(token)

    return NextResponse.json({
      success: true,
      message: result.message,
      user: result.user
    })
    
  } catch (error) {
    console.error('Email verification error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Verification failed'
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    )
  }
}