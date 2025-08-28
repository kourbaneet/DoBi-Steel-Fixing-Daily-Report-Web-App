import { resetPasswordSchema } from '@/modules/auth/validations'
import { AuthService } from '@/modules/auth/services'
import { ApiResponseUtil } from '@/lib/api-response'
import { createMethodRoute } from '@/lib/middleware/compose'
import { validateBody } from '@/lib/middleware/validation'
import { ApiRequest } from '@/lib/middleware/types'

async function resetPasswordHandler(req: ApiRequest) {
  try {
    console.log(123);

    const { token, password } = req.validatedBody

    // Process password reset
    const result = await AuthService.resetPassword(token, password)

    console.log(result);
    

    return ApiResponseUtil.success(result.message)
  } catch (error) {
    console.error('Reset password handler error:', error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        return ApiResponseUtil.badRequest(error.message)
      }
      if (error.message.includes('not found')) {
        return ApiResponseUtil.notFound(error.message)
      }
    }

    return ApiResponseUtil.serverError('Failed to reset password')
  }
}

// Export POST method with validation middleware
export const { POST } = createMethodRoute(
  'POST',
  [validateBody(resetPasswordSchema)],
  resetPasswordHandler
)