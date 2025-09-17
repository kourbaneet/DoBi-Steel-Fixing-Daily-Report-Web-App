import { requireAuth, requireRole } from "@/lib/middleware/auth"
import { createMethodRoute } from "@/lib/middleware/compose"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { WorkerService } from "@/modules/worker/services"
import { WORKER_CONSTANTS } from "@/modules/worker/constants"

// GET handler - List weeks for logged-in worker
const getWeeksHandler = async (req: ApiRequest) => {
  try {
    // Parse query parameters
    const { searchParams } = new URL(req.url)

    const params = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "12"),
    }

    const result = await WorkerService.getWeeks(params, req.user)

    // Return in the expected format for the frontend
    return ApiResponseUtil.success(
      WORKER_CONSTANTS.SUCCESS.WEEKS_RETRIEVED,
      result.weeks,
      200,
      {
        page: result.page,
        limit: result.limit,
        total: result.totalCount,
        totalPages: result.totalPages
      }
    )
  } catch (error) {
    console.error("Error fetching worker weeks:", error)

    if (error instanceof Error) {
      if (error.message === WORKER_CONSTANTS.ERRORS.UNAUTHORIZED) {
        return ApiResponseUtil.unauthorized(error.message)
      }
      if (error.message === WORKER_CONSTANTS.ERRORS.FORBIDDEN) {
        return ApiResponseUtil.forbidden(error.message)
      }
      if (error.message === WORKER_CONSTANTS.ERRORS.CONTRACTOR_NOT_FOUND) {
        return ApiResponseUtil.notFound(error.message)
      }
    }

    return ApiResponseUtil.serverError(WORKER_CONSTANTS.ERRORS.SERVER_ERROR)
  }
}

// Create route with middleware
export const GET = createMethodRoute(
  'GET',
  [
    requireAuth(),
    requireRole(['WORKER'])
  ],
  getWeeksHandler
).GET