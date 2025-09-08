import { requireAuth, requireRole } from "@/lib/middleware/auth"
import { validateBody } from "@/lib/middleware/validation"
import { createMethodRoute } from "@/lib/middleware/compose"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { BuilderService } from "@/modules/builder/services"
import { updateBuilderSchema } from "@/modules/builder/validations"
import { BUILDER_CONSTANTS } from "@/modules/builder/constants"

// GET handler - Get builder details
const getBuilderHandler = async (req: ApiRequest, { params }: { params: { builderId: string } }) => {
  try {
    const { builderId } = params

    if (!builderId) {
      return ApiResponseUtil.badRequest("Builder ID is required")
    }

    const builder = await BuilderService.getBuilderById(builderId)
    return ApiResponseUtil.success("Builder retrieved successfully", { builder })
  } catch (error) {
    console.error("Error fetching builder:", error)
    
    if (error instanceof Error) {
      if (error.message === BUILDER_CONSTANTS.ERRORS.BUILDER_NOT_FOUND) {
        return ApiResponseUtil.notFound(error.message)
      }
    }
    
    return ApiResponseUtil.serverError(BUILDER_CONSTANTS.ERRORS.SERVER_ERROR)
  }
}

// PATCH handler - Update builder
const updateBuilderHandler = async (req: ApiRequest) => {
  try {
    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/')
    const builderId = pathSegments[pathSegments.length - 1]

    if (!builderId) {
      return ApiResponseUtil.badRequest("Builder ID is required")
    }

    const updateData = { ...req.validatedBody, builderId }
    const builder = await BuilderService.updateBuilder(updateData)
    
    return ApiResponseUtil.success(
      BUILDER_CONSTANTS.SUCCESS.BUILDER_UPDATED, 
      { builder }
    )
  } catch (error) {
    console.error("Error updating builder:", error)
    
    if (error instanceof Error) {
      if (error.message === BUILDER_CONSTANTS.ERRORS.BUILDER_NOT_FOUND) {
        return ApiResponseUtil.notFound(error.message)
      }
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

// DELETE handler - Delete builder
const deleteBuilderHandler = async (req: ApiRequest) => {
  try {
    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/')
    const builderId = pathSegments[pathSegments.length - 1]

    if (!builderId) {
      return ApiResponseUtil.badRequest("Builder ID is required")
    }

    const result = await BuilderService.deleteBuilder(builderId)
    return ApiResponseUtil.success(result.message)
  } catch (error) {
    console.error("Error deleting builder:", error)
    
    if (error instanceof Error) {
      if (error.message === BUILDER_CONSTANTS.ERRORS.BUILDER_NOT_FOUND) {
        return ApiResponseUtil.notFound(error.message)
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
  getBuilderHandler
).GET

export const PATCH = createMethodRoute(
  'PATCH',
  [
    requireAuth(),
    requireRole(['ADMIN']),
    validateBody(updateBuilderSchema.omit({ builderId: true }))
  ],
  updateBuilderHandler
).PATCH

export const DELETE = createMethodRoute(
  'DELETE',
  [
    requireAuth(),
    requireRole(['ADMIN'])
  ],
  deleteBuilderHandler
).DELETE