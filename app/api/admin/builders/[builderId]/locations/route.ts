import { requireAuth, requireRole } from "@/lib/middleware/auth"
import { validateBody } from "@/lib/middleware/validation"
import { createMethodRoute } from "@/lib/middleware/compose"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { BuilderService } from "@/modules/builder/services"
import { createBuilderLocationSchema } from "@/modules/builder/validations"
import { BUILDER_CONSTANTS } from "@/modules/builder/constants"

// GET handler - Get builder locations
const getBuilderLocationsHandler = async (req: ApiRequest, { params }: { params: { builderId: string } }) => {
  try {
    const { builderId } = params

    if (!builderId) {
      return ApiResponseUtil.badRequest("Builder ID is required")
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const queryParams = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      search: searchParams.get("search") || undefined,
    }

    // Remove undefined values
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key as keyof typeof queryParams] === undefined) {
        delete queryParams[key as keyof typeof queryParams]
      }
    })

    const result = await BuilderService.getBuilderLocations(builderId, queryParams)
    return ApiResponseUtil.paginated(
      "Builder locations retrieved successfully",
      result.locations,
      result.page,
      result.limit,
      result.totalCount,
      result.totalPages
    )
  } catch (error) {
    console.error("Error fetching builder locations:", error)
    
    if (error instanceof Error) {
      if (error.message === BUILDER_CONSTANTS.ERRORS.BUILDER_NOT_FOUND) {
        return ApiResponseUtil.notFound(error.message)
      }
    }
    
    return ApiResponseUtil.serverError(BUILDER_CONSTANTS.ERRORS.SERVER_ERROR)
  }
}

// POST handler - Create builder location
const createBuilderLocationHandler = async (req: ApiRequest, { params }: { params: { builderId: string } }) => {
  try {
    const { builderId } = params

    if (!builderId) {
      return ApiResponseUtil.badRequest("Builder ID is required")
    }

    const locationData = { ...req.validatedBody, builderId }
    const location = await BuilderService.createBuilderLocation(locationData)
    
    return ApiResponseUtil.success(
      BUILDER_CONSTANTS.SUCCESS.LOCATION_CREATED, 
      { location }
    )
  } catch (error) {
    console.error("Error creating builder location:", error)
    
    if (error instanceof Error) {
      if (error.message === BUILDER_CONSTANTS.ERRORS.BUILDER_NOT_FOUND) {
        return ApiResponseUtil.notFound(error.message)
      }
      if (error.message === BUILDER_CONSTANTS.ERRORS.LOCATION_LABEL_EXISTS) {
        return ApiResponseUtil.badRequest(error.message)
      }
      if (error.message.includes("validation")) {
        return ApiResponseUtil.validationError(error.message, {})
      }
    }
    
    return ApiResponseUtil.serverError(BUILDER_CONSTANTS.ERRORS.SERVER_ERROR)
  }
}

// Create routes with middleware
export const GET = createMethodRoute(
  'GET',
  [
    requireAuth(),
    requireRole(['ADMIN', 'SUPERVISOR'])
  ],
  getBuilderLocationsHandler
).GET

export const POST = createMethodRoute(
  'POST',
  [
    requireAuth(),
    requireRole(['ADMIN']),
    validateBody(createBuilderLocationSchema.omit({ builderId: true }))
  ],
  createBuilderLocationHandler
).POST