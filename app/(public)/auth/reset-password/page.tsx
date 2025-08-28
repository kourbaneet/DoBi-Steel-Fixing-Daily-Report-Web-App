"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { GalleryVerticalEnd } from "lucide-react"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { Alert, AlertDescription } from "@/components/ui/alert"

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  if (!token) {
    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <a href="#" className="flex items-center gap-2 self-center font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Dobi Steel
          </a>
          <Alert variant="destructive">
            <AlertDescription>
              Invalid or missing reset token. Please request a new password reset link.
            </AlertDescription>
          </Alert>
          <div className="text-center text-sm">
            <a 
              href="/auth/forgot-password" 
              className="underline underline-offset-4 hover:text-primary"
            >
              Request new reset link
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Dobi Steel
        </a>
        <ResetPasswordForm token={token} />
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}