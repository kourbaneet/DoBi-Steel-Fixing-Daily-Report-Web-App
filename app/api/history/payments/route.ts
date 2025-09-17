import { requireAuth, requireRole } from "@/lib/middleware/auth"
import { createMethodRoute } from "@/lib/middleware/compose"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { HistoryService } from "@/modules/history/services"
import { HISTORY_CONSTANTS } from "@/modules/history/constants"

// GET handler - Get payments history with filters
const getPaymentsHistoryHandler = async (req: ApiRequest) => {
  try {
    const { searchParams } = new URL(req.url)

    const params = {
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      contractorId: searchParams.get("contractorId") || undefined,
      status: searchParams.get("status") as 'DRAFT' | 'SUBMITTED' | 'PAID' | undefined,
      q: searchParams.get("q") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "50"),
    }

    const result = await HistoryService.getPaymentsHistory(params, req.user)

    return ApiResponseUtil.success(
      HISTORY_CONSTANTS.SUCCESS.PAYMENTS_RETRIEVED,
      {
        payments: result.payments,
        totals: result.totals
      },
      200,
      {
        page: result.page,
        limit: result.limit,
        total: result.totalCount,
        totalPages: result.totalPages
      }
    )
  } catch (error) {
    console.error("Error fetching payments history:", error)

    if (error instanceof Error) {
      if (error.message === HISTORY_CONSTANTS.ERRORS.UNAUTHORIZED) {
        return ApiResponseUtil.unauthorized(error.message)
      }
      if (error.message === HISTORY_CONSTANTS.ERRORS.FORBIDDEN) {
        return ApiResponseUtil.forbidden(error.message)
      }
    }

    return ApiResponseUtil.serverError(HISTORY_CONSTANTS.ERRORS.SERVER_ERROR)
  }
}

// Create route with middleware
export const GET = createMethodRoute(
  'GET',
  [
    requireAuth(),
    requireRole(['ADMIN'])
  ],
  getPaymentsHistoryHandler
).GET