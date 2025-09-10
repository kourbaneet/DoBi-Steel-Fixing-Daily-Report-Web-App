import { requireAuth, requireRole } from "@/lib/middleware/auth"
import { validateBody, validateParams } from "@/lib/middleware/validation"
import { createMethodRoute } from "@/lib/middleware/compose"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { DocketService } from "@/modules/docket/services"
import { updateDocketSchema, deleteDocketSchema } from "@/modules/docket/validations"
import { DOCKET_CONSTANTS } from "@/modules/docket/constants"

// GET handler - Get single docket
const getDocketHandler = async (req: ApiRequest, { params }: { params: { docketId: string } }) => {
  try {
    const { docketId } = params
    
    const result = await DocketService.getDocketById(docketId, req.user)
    
    return ApiResponseUtil.success(
      DOCKET_CONSTANTS.SUCCESS.DOCKET_RETRIEVED,
      result
    )
  } catch (error) {
    console.error("Error fetching docket:", error)
    
    if (error instanceof Error) {
      if (error.message === DOCKET_CONSTANTS.ERRORS.DOCKET_NOT_FOUND) {
        return ApiResponseUtil.notFound(error.message)
      }
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

// PUT handler - Update docket
const updateDocketHandler = async (req: ApiRequest, { params }: { params: { docketId: string } }) => {
  try {
    const { docketId } = params
    const updateData = {
      docketId,
      ...req.validatedBody
    }
    
    const result = await DocketService.updateDocket(updateData, req.user)
    
    return ApiResponseUtil.success(
      DOCKET_CONSTANTS.SUCCESS.DOCKET_UPDATED,
      result
    )
  } catch (error) {
    console.error("Error updating docket:", error)
    
    if (error instanceof Error) {
      if (error.message === DOCKET_CONSTANTS.ERRORS.DOCKET_NOT_FOUND) {
        return ApiResponseUtil.notFound(error.message)
      }
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

// DELETE handler - Delete docket
const deleteDocketHandler = async (req: ApiRequest, { params }: { params: { docketId: string } }) => {
  try {
    const { docketId } = params
    
    await DocketService.deleteDocket(docketId, req.user)
    
    return ApiResponseUtil.success(
      DOCKET_CONSTANTS.SUCCESS.DOCKET_DELETED,
      { docketId }
    )
  } catch (error) {
    console.error("Error deleting docket:", error)
    
    if (error instanceof Error) {
      if (error.message === DOCKET_CONSTANTS.ERRORS.DOCKET_NOT_FOUND) {
        return ApiResponseUtil.notFound(error.message)
      }
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

// Create routes with middleware
export const GET = createMethodRoute(
  'GET',
  [
    requireAuth(),
    requireRole(['ADMIN', 'SUPERVISOR']) // Workers cannot access dockets
  ],
  getDocketHandler
).GET

export const PUT = createMethodRoute(
  'PUT',
  [
    requireAuth(),
    requireRole(['ADMIN', 'SUPERVISOR']), // Workers cannot update dockets
    validateBody(updateDocketSchema.omit({ docketId: true })) // docketId comes from URL
  ],
  updateDocketHandler
).PUT

export const DELETE = createMethodRoute(
  'DELETE',
  [
    requireAuth(),
    requireRole(['ADMIN', 'SUPERVISOR']) // Workers cannot delete dockets
  ],
  deleteDocketHandler
).DELETE