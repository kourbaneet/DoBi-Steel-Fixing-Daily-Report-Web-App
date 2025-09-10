import { NextRequest, NextResponse } from 'next/server'
import { Session } from 'next-auth'

export interface ApiRequest extends NextRequest {
  user?: any
  session?: Session | null
  validatedBody?: any
  params?: Record<string, string>
}

export type ApiHandler = (
  _req: ApiRequest,
  _context?: any
) => Promise<NextResponse | void>

export type MiddlewareFunction = (
  _req: ApiRequest,
  _next: () => Promise<NextResponse | void>
) => Promise<NextResponse | void>