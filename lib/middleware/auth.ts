import { auth } from '@/libs/next-auth'
import { ApiRequest, MiddlewareFunction } from './types'
import { ApiResponseUtil } from '@/lib/api-response'

export function requireAuth(): MiddlewareFunction {
  return async (req: ApiRequest, next) => {
    try {
      const session = await auth()
      
      if (!session || !session.user) {
        return ApiResponseUtil.unauthorized('Authentication required')
      }
      
      // Attach user to request
      req.user = session.user
      return await next()
    } catch (error) {
      console.error('Auth middleware error:', error)
      return ApiResponseUtil.unauthorized('Invalid authentication')
    }
  }
}

export function requireRole(roles: string[]): MiddlewareFunction {
  return async (req: ApiRequest, next) => {
    if (!req.user) {
      return ApiResponseUtil.unauthorized('Authentication required')
    }
    
    // Assuming user has a role property
    const userRole = req.user.role || 'user'
    
    if (!roles.includes(userRole)) {
      return ApiResponseUtil.forbidden('Insufficient permissions')
    }
    
    return await next()
  }
}

export function optionalAuth(): MiddlewareFunction {
  return async (req: ApiRequest, next) => {
    try {
      const session = await auth()
      
      if (session && session.user) {
        req.user = session.user
      }
      
      return await next()
    } catch (error) {
      console.error('Optional auth middleware error:', error)
      // Continue without auth if there's an error
      return await next()
    }
  }
}