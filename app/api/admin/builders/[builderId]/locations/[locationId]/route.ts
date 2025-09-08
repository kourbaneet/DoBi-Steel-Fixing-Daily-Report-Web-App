import { requireAuth, requireRole } from "@/lib/middleware/auth"
import { validateBody } from "@/lib/middleware/validation"
import { createMethodRoute } from "@/lib/middleware/compose"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { BuilderService } from "@/modules/builder/services"
import { updateBuilderLocationSchema } from "@/modules/builder/validations"
import { BUILDER_CONSTANTS } from "@/modules/builder/constants"

// PATCH handler - Update builder location
const updateBuilderLocationHandler = async (
  req: ApiRequest, 
  { params }: { params: { builderId: string; locationId: string } }
) => {
  try {
    const { builderId, locationId } = params

    if (!builderId) {
      return ApiResponseUtil.badRequest("Builder ID is required")
    }

    if (!locationId) {
      return ApiResponseUtil.badRequest("Location ID is required")
    }

    const updateData = { ...req.validatedBody, builderId, locationId }
    const location = await BuilderService.updateBuilderLocation(updateData)
    
    return ApiResponseUtil.success(
      BUILDER_CONSTANTS.SUCCESS.LOCATION_UPDATED, 
      { location }
    )
  } catch (error) {
    console.error("Error updating builder location:", error)
    
    if (error instanceof Error) {
      if (error.message === BUILDER_CONSTANTS.ERRORS.LOCATION_NOT_FOUND) {
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

// DELETE handler - Delete builder location
const deleteBuilderLocationHandler = async (
  req: ApiRequest, 
  { params }: { params: { builderId: string; locationId: string } }
) => {
  try {
    const { builderId, locationId } = params

    if (!builderId) {
      return ApiResponseUtil.badRequest("Builder ID is required")
    }

    if (!locationId) {
      return ApiResponseUtil.badRequest("Location ID is required")
    }

    const result = await BuilderService.deleteBuilderLocation(builderId, locationId)
    return ApiResponseUtil.success(result.message)
  } catch (error) {
    console.error("Error deleting builder location:", error)
    
    if (error instanceof Error) {
      if (error.message === BUILDER_CONSTANTS.ERRORS.LOCATION_NOT_FOUND) {
        return ApiResponseUtil.notFound(error.message)
      }
    }
    
    return ApiResponseUtil.serverError(BUILDER_CONSTANTS.ERRORS.SERVER_ERROR)
  }
}

// Create routes with middleware
export const PATCH = createMethodRoute(
  'PATCH',
  [
    requireAuth(),
    requireRole(['ADMIN']),
    validateBody(updateBuilderLocationSchema.omit({ builderId: true, locationId: true }))
  ],
  updateBuilderLocationHandler
).PATCH

export const DELETE = createMethodRoute(
  'DELETE',
  [
    requireAuth(),
    requireRole(['ADMIN'])
  ],
  deleteBuilderLocationHandler
).DELETE