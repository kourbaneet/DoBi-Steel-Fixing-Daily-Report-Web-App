import { NextRequest, NextResponse } from 'next/server'

export interface ApiRequest extends NextRequest {
  user?: any
  validatedBody?: any
  params?: Record<string, string>
}

export type ApiHandler = (
  _req: ApiRequest,
  _res?: NextResponse
) => Promise<NextResponse | void>

export type MiddlewareFunction = (
  _req: ApiRequest,
  _next: () => Promise<NextResponse | void>
) => Promise<NextResponse | void>