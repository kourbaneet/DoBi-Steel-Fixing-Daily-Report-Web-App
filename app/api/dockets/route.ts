import { requireAuth, requireRole } from "@/lib/middleware/auth"
import { validateBody } from "@/lib/middleware/validation"
import { createMethodRoute } from "@/lib/middleware/compose"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { DocketService } from "@/modules/docket/services"
import { createDocketSchema, getDocketsSchema } from "@/modules/docket/validations"
import { DOCKET_CONSTANTS } from "@/modules/docket/constants"

// GET handler - List dockets
const getDocketsHandler = async (req: ApiRequest) => {
  try {
    // Manually parse query parameters
    const { searchParams } = new URL(req.url)
    const startDateStr = searchParams.get("startDate")
    const endDateStr = searchParams.get("endDate")
    
    const params = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      builderId: searchParams.get("builderId") || undefined,
      locationId: searchParams.get("locationId") || undefined,
      supervisorId: searchParams.get("supervisorId") || undefined,
      startDate: startDateStr ? new Date(startDateStr) : undefined,
      endDate: endDateStr ? new Date(endDateStr) : undefined,
      sortBy: (searchParams.get("sortBy") as any) || 'date',
      sortOrder: (searchParams.get("sortOrder") as any) || 'desc',
    }

    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key as keyof typeof params] === undefined) {
        delete params[key as keyof typeof params]
      }
    })

    const result = await DocketService.getDockets(params, req.user)
    return ApiResponseUtil.paginated(
      DOCKET_CONSTANTS.SUCCESS.DOCKETS_RETRIEVED,
      result.dockets,
      result.page,
      result.limit,
      result.totalCount,
      result.totalPages
    )
  } catch (error) {
    console.error("Error fetching dockets:", error)
    
    if (error instanceof Error) {
      if (error.message === DOCKET_CONSTANTS.ERRORS.UNAUTHORIZED) {
        return ApiResponseUtil.unauthorized(error.message)
      }
      if (error.message === DOCKET_CONSTANTS.ERRORS.FORBIDDEN) {
        return ApiResponseUtil.forbidden(error.message)
      }
    }
    
    return ApiResponseUtil.serverError(DOCKET_CONSTANTS.ERRORS.SERVER_ERROR)
  }
}

// POST handler - Create docket
const createDocketHandler = async (req: ApiRequest) => {
  try {
    const result = await DocketService.createDocket(req.validatedBody, req.user)
    
    return ApiResponseUtil.created(
      DOCKET_CONSTANTS.SUCCESS.DOCKET_CREATED, 
      result
    )
  } catch (error) {
    console.error("Error creating docket:", error)
    
    if (error instanceof Error) {
      if (error.message === DOCKET_CONSTANTS.ERRORS.UNAUTHORIZED) {
        return ApiResponseUtil.unauthorized(error.message)
      }
      if (error.message === DOCKET_CONSTANTS.ERRORS.FORBIDDEN) {
        return ApiResponseUtil.forbidden(error.message)
      }
      if (error.message === DOCKET_CONSTANTS.ERRORS.BUILDER_NOT_FOUND ||
          error.message === DOCKET_CONSTANTS.ERRORS.LOCATION_NOT_FOUND ||
          error.message === DOCKET_CONSTANTS.ERRORS.SUPERVISOR_NOT_FOUND ||
          error.message === DOCKET_CONSTANTS.ERRORS.CONTRACTOR_NOT_FOUND) {
        return ApiResponseUtil.badRequest(error.message)
      }
      if (error.message.includes("validation") || 
          error.message.includes("hours") ||
          error.message.includes("entry")) {
        return ApiResponseUtil.validationError(error.message, {})
      }
    }
    
    return ApiResponseUtil.serverError(DOCKET_CONSTANTS.ERRORS.SERVER_ERROR)
  }
}

// Create routes with middleware
export const GET = createMethodRoute(
  'GET',
  [
    requireAuth(),
    requireRole(['ADMIN', 'SUPERVISOR']) // Workers cannot access dockets
  ],
  getDocketsHandler
).GET

export const POST = createMethodRoute(
  'POST',
  [
    requireAuth(),
    requireRole(['ADMIN', 'SUPERVISOR']), // Workers cannot create dockets
    validateBody(createDocketSchema)
  ],
  createDocketHandler
).POST