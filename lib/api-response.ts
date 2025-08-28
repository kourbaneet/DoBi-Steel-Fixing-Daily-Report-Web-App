import { NextResponse } from 'next/server'

export interface ApiResponse<T = any, E = any> {
  success: boolean
  message: string
  data?: T
  errors?: E | null
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

export class ApiResponseUtil {
  private static createResponse<T, E>(
    success: boolean,
    message: string,
    status: number,
    data?: T,
    errors?: E | null,
    meta?: ApiResponse<T, E>['meta']
  ): NextResponse {
    const response: ApiResponse<T, E> = {
      success,
      message,
      ...(data !== undefined && { data }),
      errors: errors || null,
      ...(meta && { meta })
    }

    return NextResponse.json(response, { status })
  }

  static success<T>(
    message: string = 'Success',
    data?: T,
    status: number = 200,
    meta?: ApiResponse<T>['meta']
  ): NextResponse {
    return this.createResponse(true, message, status, data, null, meta)
  }

  static created<T>(
    message: string = 'Resource created successfully',
    data?: T,
    meta?: ApiResponse<T>['meta']
  ): NextResponse {
    return this.createResponse(true, message, 201, data, null, meta)
  }

  static badRequest<E>(
    message: string = 'Bad request',
    errors?: E
  ): NextResponse {
    return this.createResponse(false, message, 400, undefined, errors)
  }

  static unauthorized(
    message: string = 'Unauthorized'
  ): NextResponse {
    return this.createResponse(false, message, 401)
  }

  static forbidden(
    message: string = 'Forbidden'
  ): NextResponse {
    return this.createResponse(false, message, 403)
  }

  static notFound(
    message: string = 'Resource not found'
  ): NextResponse {
    return this.createResponse(false, message, 404)
  }

  static conflict(
    message: string = 'Conflict'
  ): NextResponse {
    return this.createResponse(false, message, 409)
  }

  static validationError<E>(
    message: string = 'Validation failed',
    errors: E
  ): NextResponse {
    return this.createResponse(false, message, 422, undefined, errors)
  }

  static serverError(
    message: string = 'Internal server error',
    error?: any
  ): NextResponse {
    if (error) {
      console.error('API Server Error:', error)
    }
    
    return this.createResponse(false, message, 500)
  }

  static paginated<T>(
    message: string = 'Success',
    data: T[],
    page: number,
    limit: number,
    total: number,
    totalPages: number
  ): NextResponse {
    return this.createResponse(
      true,
      message,
      200,
      data,
      null,
      {
        page,
        limit,
        total,
        totalPages
      }
    )
  }
}