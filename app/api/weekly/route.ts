import { requireAuth, requireRole } from '@/lib/middleware/auth'
import { createMethodRoute } from '@/lib/middleware/compose'
import { ApiRequest } from '@/lib/middleware/types'
import { ApiResponseUtil } from '@/lib/api-response'
import { WeeklyService } from '@/modules/weekly/services'
import { getWeeklySchema } from '@/modules/weekly/validations'
import { WEEKLY_CONSTANTS } from '@/modules/weekly/constants'

// GET handler - Get weekly timesheet data
const getWeeklyHandler = async (req: ApiRequest) => {
  try {
    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const params = {
      week: searchParams.get('week') || undefined,
      weekStart: searchParams.get('weekStart') || undefined,
      builderId: searchParams.get('builderId') || undefined,
      locationId: searchParams.get('locationId') || undefined,
      q: searchParams.get('q') || undefined,
    }

    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key as keyof typeof params] === undefined) {
        delete params[key as keyof typeof params]
      }
    })

    // Validate parameters
    const validationResult = getWeeklySchema.safeParse(params)
    if (!validationResult.success) {
      return ApiResponseUtil.validationError(
        'Invalid parameters',
        validationResult.error.flatten().fieldErrors
      )
    }

    const result = await WeeklyService.getWeeklyData(validationResult.data, req.user)
    
    return ApiResponseUtil.success(
      WEEKLY_CONSTANTS.SUCCESS.WEEKLY_DATA_RETRIEVED,
      result.data
    )
  } catch (error) {
    console.error('Error fetching weekly data:', error)
    
    if (error instanceof Error) {
      if (error.message === WEEKLY_CONSTANTS.ERRORS.UNAUTHORIZED) {
        return ApiResponseUtil.unauthorized(error.message)
      }
      if (error.message === WEEKLY_CONSTANTS.ERRORS.FORBIDDEN) {
        return ApiResponseUtil.forbidden(error.message)
      }
      if (error.message.includes('Invalid week') || error.message.includes('Invalid date')) {
        return ApiResponseUtil.badRequest(error.message)
      }
    }
    
    return ApiResponseUtil.serverError(WEEKLY_CONSTANTS.ERRORS.SERVER_ERROR)
  }
}

// Create routes with middleware
export const GET = createMethodRoute(
  'GET',
  [
    requireAuth(),
    requireRole(['ADMIN', 'SUPERVISOR']) // Only ADMIN and SUPERVISOR can access weekly data
  ],
  getWeeklyHandler
).GET