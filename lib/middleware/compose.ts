import { NextResponse } from 'next/server'
import { ApiRequest, ApiHandler, MiddlewareFunction } from './types'
import { ApiResponseUtil } from '@/lib/api-response'

export function composeMiddleware(
  middlewares: MiddlewareFunction[],
  handler: ApiHandler
) {
  return async (req: ApiRequest): Promise<NextResponse> => {
    try {
      let index = 0

      const next = async (): Promise<NextResponse | void> => {
        if (index < middlewares.length) {
          const middleware = middlewares[index++]
          return await middleware(req, next)
        } else {
          return await handler(req)
        }
      }

      const result = await next()
      return result || ApiResponseUtil.success('Success')
    } catch (error) {
      console.error('Middleware error:', error)
      return ApiResponseUtil.serverError('Internal server error', error)
    }
  }
}

// Convenience function to create API route with middleware
export function createApiRoute(
  middlewares: MiddlewareFunction[],
  handler: ApiHandler
) {
  const composedHandler = composeMiddleware(middlewares, handler)
  
  return {
    GET: composedHandler,
    POST: composedHandler,
    PUT: composedHandler,
    PATCH: composedHandler,
    DELETE: composedHandler,
  }
}

// Method-specific route creator
export function createMethodRoute(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  middlewares: MiddlewareFunction[],
  handler: ApiHandler
) {
  const composedHandler = composeMiddleware(middlewares, handler)
  
  return {
    [method]: composedHandler
  }
}