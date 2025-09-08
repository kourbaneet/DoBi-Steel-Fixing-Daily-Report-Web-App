import { requireAuth, requireRole } from "@/lib/middleware/auth"
import { validateBody, validateQuery } from "@/lib/middleware/validation"
import { createMethodRoute } from "@/lib/middleware/compose"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { BuilderService } from "@/modules/builder/services"
import { createBuilderSchema, getBuildersSchema } from "@/modules/builder/validations"
import { BUILDER_CONSTANTS } from "@/modules/builder/constants"

// GET handler - List builders
const getBuildersHandler = async (req: ApiRequest) => {
  try {
    // Manually parse query parameters
    const { searchParams } = new URL(req.url)
    const params = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      search: searchParams.get("search") || undefined,
      sortBy: (searchParams.get("sortBy") as any) || 'createdAt',
      sortOrder: (searchParams.get("sortOrder") as any) || 'desc',
    }

    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key as keyof typeof params] === undefined) {
        delete params[key as keyof typeof params]
      }
    })

    const result = await BuilderService.getBuilders(params)
    return ApiResponseUtil.paginated(
      "Builders retrieved successfully",
      result.builders,
      result.page,
      result.limit,
      result.totalCount,
      result.totalPages
    )
  } catch (error) {
    console.error("Error fetching builders:", error)
    return ApiResponseUtil.serverError(BUILDER_CONSTANTS.ERRORS.SERVER_ERROR)
  }
}

// POST handler - Create builder
const createBuilderHandler = async (req: ApiRequest) => {
  try {
    const builder = await BuilderService.createBuilder(req.validatedBody)
    
    return ApiResponseUtil.success(
      BUILDER_CONSTANTS.SUCCESS.BUILDER_CREATED, 
      { builder }
    )
  } catch (error) {
    console.error("Error creating builder:", error)
    
    if (error instanceof Error) {
      if (error.message === BUILDER_CONSTANTS.ERRORS.COMPANY_CODE_EXISTS) {
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
  getBuildersHandler
).GET

export const POST = createMethodRoute(
  'POST',
  [
    requireAuth(),
    requireRole(['ADMIN']),
    validateBody(createBuilderSchema)
  ],
  createBuilderHandler
).POST