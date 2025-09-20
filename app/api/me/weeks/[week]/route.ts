import { NextRequest } from "next/server"
import { requireAuth, requireRole } from "@/lib/middleware/auth"
import { composeMiddleware } from "@/lib/middleware/compose"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { WorkerService } from "@/modules/worker/services"
import { WORKER_CONSTANTS } from "@/modules/worker/constants"

// GET handler - Get week details for logged-in worker
const getWeekDetailsHandler = async (req: ApiRequest, { params }: { params: Promise<{ week: string }> }) => {
  try {
    const { week } = await params
    const result = await WorkerService.getWeekDetails({ week }, req.user)

    return ApiResponseUtil.success(
      WORKER_CONSTANTS.SUCCESS.WEEK_DETAILS_RETRIEVED,
      result.details
    )
  } catch (error) {
    console.error("Error fetching worker week details:", error)

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
      if (error.message === WORKER_CONSTANTS.ERRORS.NO_TIMESHEET_DATA) {
        return ApiResponseUtil.notFound(error.message)
      }
      if (error.message === WORKER_CONSTANTS.ERRORS.INVALID_WEEK_FORMAT) {
        return ApiResponseUtil.badRequest(error.message)
      }
    }

    return ApiResponseUtil.serverError(WORKER_CONSTANTS.ERRORS.SERVER_ERROR)
  }
}

// Create route with middleware
export async function GET(request: NextRequest, context: { params: Promise<{ week: string }> }) {
  const composedHandler = composeMiddleware(
    [
      requireAuth(),
      requireRole(['WORKER'])
    ],
    (req: ApiRequest) => getWeekDetailsHandler(req, context)
  )

  return composedHandler(request as ApiRequest)
}