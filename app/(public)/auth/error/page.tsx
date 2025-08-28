"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

const errorMessages = {
  configuration: "There is a problem with the server configuration.",
  accessdenied: "Access denied. You do not have permission to sign in.",
  verification: "The verification token has expired or has already been used.",
  default: "An error occurred during authentication."
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error") as keyof typeof errorMessages

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-red-600 mb-6">
          {errorMessages[error] || errorMessages.default}
        </p>
        <Link 
          href="/auth/login" 
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Try Again
        </Link>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="max-w-md text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}