"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const verified = searchParams.get('verified')
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading')
  const [message, setMessage] = useState('')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    // If already verified via GET redirect, show success immediately
    if (verified === 'true') {
      setStatus('success')
      setMessage('Email verified successfully!')
      return
    }

    const verifyToken = async () => {
      if (!token) {
        setStatus('no-token')
        setMessage('No verification token provided.')
        return
      }

      try {
        const result = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        const data = await result.json()

        if (result.ok) {
          setStatus('success')
          setMessage(data.message || 'Email verified successfully!')
          setUserEmail(data.user?.email || '')
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed. The link may be expired or invalid.')
        }
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
        setMessage('Verification failed. Please try again.')
      }
    }

    verifyToken()
  }, [token, verified])

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="max-w-md text-center">
          <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold mb-2">Verifying your email...</h1>
          <p className="text-gray-600">Please wait while we verify your email address.</p>
        </div>
      </div>
    )
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-green-700 mb-2">Email Verified!</h1>
          <p className="text-gray-600 mb-6">
            Your email address has been successfully verified. Your account is now active and ready to use.
          </p>
          {userEmail && (
            <p className="text-sm text-gray-500 mb-6">
              Verified email: <strong>{userEmail}</strong>
            </p>
          )}
          
          <div className="space-y-4">
            <Link 
              href="/auth/login" 
              className="inline-block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Sign In to Your Account
            </Link>
            
            <Link 
              href="/" 
              className="inline-block w-full text-gray-600 hover:text-gray-800 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-700 mb-2">Verification Failed</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="space-y-4">
            <Link 
              href="/auth/register" 
              className="inline-block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Register Again
            </Link>
            
            <Link 
              href="/auth/login" 
              className="inline-block w-full text-gray-600 hover:text-gray-800 transition-colors"
            >
              Try to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // No token state
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="max-w-md text-center">
        <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
        <p className="text-gray-600 mb-6">
          We&apos;ve sent you a verification link. Please check your email and click the link to verify your account.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-blue-800 mb-2">Didn&apos;t receive the email?</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Check your spam/junk folder</li>
            <li>• Make sure the email address is correct</li>
            <li>• Wait a few minutes for the email to arrive</li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/auth/register" 
            className="inline-block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Register Again
          </Link>
          
          <Link 
            href="/" 
            className="inline-block w-full text-gray-600 hover:text-gray-800 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="max-w-md text-center">
          <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold mb-2">Loading...</h1>
          <p className="text-gray-600">Please wait while we process your request.</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}