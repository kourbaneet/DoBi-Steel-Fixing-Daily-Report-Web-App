"use client"

import React, { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { registerSchema } from "@/modules/auth/validations"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState("")
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn("google", { callbackUrl: "/dashboard" })
    } catch (error) {
      console.error("Google sign in error:", error)
    }
    setIsLoading(false)
  }

  const handleEmailSignIn = async () => {
    setIsLoading(true)
    try {
      const result = await signIn("email", { 
        email, 
        callbackUrl: "/dashboard",
        redirect: false 
      })
      if (result?.error) {
        console.error("Email sign in error:", result.error)
      } else if (result?.ok) {
        router.push("/auth/verify-email")
      }
    } catch (error) {
      console.error("Email sign in error:", error)
    }
    setIsLoading(false)
  }

  const handlePasswordRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setGeneralError("")

    // Client-side validation with Zod
    const formData = { email, password, name: name || undefined }
    const validation = registerSchema.safeParse(formData)

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords don't match" })
      return
    }

    setIsLoading(true)
    try {
      const result = await signIn("credentials", { 
        email, 
        password,
        isRegister: "true",
        callbackUrl: "/dashboard",
        redirect: false 
      })
      
      if (result?.error) {
        // Show user-friendly error messages based on NextAuth error types
        if (result.error === 'CredentialsSignin') {
          setGeneralError("Registration failed. Email may already be in use or there was a validation error.")
        } else if (result.error === 'Callback') {
          setGeneralError("Registration failed. Please check your information and try again.")
        } else if (result.error === 'AccessDenied') {
          setGeneralError("Access denied. Please try again.")
        } else {
          setGeneralError("Registration failed. Please try again.")
        }
      } else if (result?.ok) {
        // Registration successful, redirect to check email page
        router.push("/auth/verify-email")
      }
    } catch (error) {
      setGeneralError("Registration failed. Please try again.")
      console.error("Registration error:", error)
    }
    setIsLoading(false)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Sign up with your Google account or email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                Sign up with Google
              </Button>
              <Button variant="outline" className="w-full" onClick={handleEmailSignIn} disabled={isLoading}>
                Sign up with Email Link
              </Button>
            </div>
            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-card text-muted-foreground relative z-10 px-2">
                Or continue with
              </span>
            </div>
            <form onSubmit={handlePasswordRegister}>
              <div className="grid gap-6">
                {generalError && (
                  <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                    {generalError}
                  </div>
                )}
                
                <div className="grid gap-3">
                  <Label htmlFor="name">Name (Optional)</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <span className="text-red-500 text-sm">{errors.name}</span>
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@dobisteel.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={errors.email ? "border-red-500" : ""}
                    required
                  />
                  {errors.email && (
                    <span className="text-red-500 text-sm">{errors.email}</span>
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={errors.password ? "border-red-500" : ""}
                    required 
                  />
                  {errors.password && (
                    <span className="text-red-500 text-sm">{errors.password}</span>
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className={errors.confirmPassword ? "border-red-500" : ""}
                    required 
                  />
                  {errors.confirmPassword && (
                    <span className="text-red-500 text-sm">{errors.confirmPassword}</span>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </div>
            </form>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <a href="/login" className="underline underline-offset-4">
                Sign in
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}