import { NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/middleware/auth"
import { createMethodRoute } from "@/lib/middleware/compose"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { HistoryService } from "@/modules/history/services"
import { HISTORY_CONSTANTS } from "@/modules/history/constants"

// GET handler - Export dockets history as CSV/XLSX
const exportDocketsHistoryHandler = async (req: ApiRequest) => {
  try {
    const { searchParams } = new URL(req.url)

    const params = {
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      builderId: searchParams.get("builderId") || undefined,
      locationId: searchParams.get("locationId") || undefined,
      supervisorId: searchParams.get("supervisorId") || undefined,
      contractorId: searchParams.get("contractorId") || undefined,
      q: searchParams.get("q") || undefined,
      format: (searchParams.get("format") || "csv") as 'csv' | 'xlsx',
    }

    const csvContent = await HistoryService.exportDocketsHistory(params, req.user)

    const filename = `dockets-history-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error("Error exporting dockets history:", error)

    if (error instanceof Error) {
      if (error.message === HISTORY_CONSTANTS.ERRORS.UNAUTHORIZED) {
        return ApiResponseUtil.unauthorized(error.message)
      }
      if (error.message === HISTORY_CONSTANTS.ERRORS.FORBIDDEN) {
        return ApiResponseUtil.forbidden(error.message)
      }
      if (error.message === HISTORY_CONSTANTS.ERRORS.EXPORT_FAILED) {
        return ApiResponseUtil.serverError(error.message)
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
  exportDocketsHistoryHandler
).GET