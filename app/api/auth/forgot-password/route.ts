import { forgotPasswordSchema } from '@/modules/auth/validations'
import { AuthService } from '@/modules/auth/services'
import { ApiResponseUtil } from '@/lib/api-response'
import { createMethodRoute } from '@/lib/middleware/compose'
import { validateBody } from '@/lib/middleware/validation'
import { ApiRequest } from '@/lib/middleware/types'

async function forgotPasswordHandler(req: ApiRequest) {
  try {
    const { email } = req.validatedBody

    // Initiate password reset process
    const result = await AuthService.initiatePasswordReset(email)

    return ApiResponseUtil.success(result.message)
  } catch (error) {
    console.error('Forgot password handler error:', error)
    return ApiResponseUtil.serverError('Failed to process password reset request')
  }
}

// Export POST method with validation middleware
export const { POST } = createMethodRoute(
  'POST',
  [validateBody(forgotPasswordSchema)],
  forgotPasswordHandler
)