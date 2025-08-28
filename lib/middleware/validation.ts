import { z } from 'zod'
import { ApiRequest, MiddlewareFunction } from './types'
import { ApiResponseUtil } from '@/lib/api-response'

export function validateBody<T>(schema: z.ZodSchema<T>): MiddlewareFunction {
  return async (req: ApiRequest, next) => {
    try {
      const body = await req.json()
      const validation = schema.safeParse(body)
      
      if (!validation.success) {
        // Convert Zod errors to match request payload structure
        const errors: Record<string, string> = {}
        validation.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            errors[issue.path[0] as string] = issue.message
          }
        })
        
        return ApiResponseUtil.validationError('Validation failed', errors)
      }
      
      // Attach validated data to request
      req.validatedBody = validation.data
      return await next()
    } catch {
      return ApiResponseUtil.badRequest('Invalid JSON payload')
    }
  }
}

export function validateQuery<T>(schema: z.ZodSchema<T>): MiddlewareFunction {
  return async (req: ApiRequest, next) => {
    const url = new URL(req.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    
    const validation = schema.safeParse(queryParams)
    
    if (!validation.success) {
      const errors: Record<string, string> = {}
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0] as string] = issue.message
        }
      })
      
      return ApiResponseUtil.validationError('Query validation failed', errors)
    }
    
    // Attach validated query to request
    req.params = { ...req.params, ...validation.data as Record<string, string> }
    return await next()
  }
}

export function validateParams<T>(schema: z.ZodSchema<T>): MiddlewareFunction {
  return async (req: ApiRequest, next) => {
    // This would be used for dynamic routes like [id]
    // The params would come from Next.js route context
    const validation = schema.safeParse(req.params)
    
    if (!validation.success) {
      const errors: Record<string, string> = {}
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0] as string] = issue.message
        }
      })
      
      return ApiResponseUtil.validationError('Parameter validation failed', errors)
    }
    
    req.params = { ...req.params, ...validation.data as Record<string, string> }
    return await next()
  }
}