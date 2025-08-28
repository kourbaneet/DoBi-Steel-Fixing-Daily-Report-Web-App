import { requireAuth, requireRole } from "@/lib/middleware/auth"
import { validateBody, validateQuery } from "@/lib/middleware/validation"
import { createMethodRoute } from "@/lib/middleware/compose"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { AdminService } from "@/modules/admin/services"
import { updateUserRoleSchema, getUsersSchema } from "@/modules/admin/validations"
import { ADMIN_CONSTANTS } from "@/modules/admin/constants"

// GET handler - List users
const getUsersHandler = async (req: ApiRequest) => {
  try {
    // Manually parse query parameters
    const { searchParams } = new URL(req.url)
    const params = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      role: searchParams.get("role") as any || undefined,
      search: searchParams.get("search") || undefined,
      emailVerified: searchParams.get("emailVerified") === "true" ? true : 
                     searchParams.get("emailVerified") === "false" ? false : undefined,
      sortBy: (searchParams.get("sortBy") as any) || 'createdAt',
      sortOrder: (searchParams.get("sortOrder") as any) || 'desc',
    }

    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key as keyof typeof params] === undefined) {
        delete params[key as keyof typeof params]
      }
    })

    const result = await AdminService.getUsers(params)
    return ApiResponseUtil.paginated(
      "Users retrieved successfully",
      result.users,
      result.page,
      result.limit,
      result.totalCount,
      result.totalPages
    )
  } catch (error) {
    console.error("Error fetching users:", error)
    return ApiResponseUtil.serverError(ADMIN_CONSTANTS.ERRORS.SERVER_ERROR)
  }
}

// PATCH handler - Update user role
const updateUserRoleHandler = async (req: ApiRequest) => {
  try {
    const adminUserId = req.user?.id
    if (!adminUserId) {
      return ApiResponseUtil.unauthorized("Admin user ID not found")
    }

    const updatedUser = await AdminService.updateUserRole(adminUserId, req.validatedBody)
    
    return ApiResponseUtil.success(
      ADMIN_CONSTANTS.SUCCESS.ROLE_UPDATED, 
      { user: updatedUser }
    )
  } catch (error) {
    console.error("Error updating user role:", error)
    
    if (error instanceof Error) {
      if (error.message === ADMIN_CONSTANTS.ERRORS.USER_NOT_FOUND) {
        return ApiResponseUtil.notFound(error.message)
      }
      if (error.message === ADMIN_CONSTANTS.ERRORS.CANNOT_CHANGE_OWN_ROLE) {
        return ApiResponseUtil.badRequest(error.message)
      }
      if (error.message.includes("validation")) {
        return ApiResponseUtil.validationError(error.message, {})
      }
    }
    
    return ApiResponseUtil.serverError(ADMIN_CONSTANTS.ERRORS.SERVER_ERROR)
  }
}

// DELETE handler - Delete user
const deleteUserHandler = async (req: ApiRequest) => {
  try {
    const adminUserId = req.user?.id
    if (!adminUserId) {
      return ApiResponseUtil.unauthorized("Admin user ID not found")
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return ApiResponseUtil.badRequest("User ID is required")
    }

    const result = await AdminService.deleteUser(adminUserId, userId)
    return ApiResponseUtil.success(result.message)
  } catch (error) {
    console.error("Error deleting user:", error)
    
    if (error instanceof Error) {
      if (error.message === ADMIN_CONSTANTS.ERRORS.USER_NOT_FOUND) {
        return ApiResponseUtil.notFound(error.message)
      }
      if (error.message.includes("Cannot delete")) {
        return ApiResponseUtil.badRequest(error.message)
      }
    }
    
    return ApiResponseUtil.serverError(ADMIN_CONSTANTS.ERRORS.SERVER_ERROR)
  }
}

// Create routes with middleware
export const GET = createMethodRoute(
  'GET',
  [
    requireAuth(),
    requireRole(['ADMIN'])
    // Temporarily removed query validation for debugging
    // validateQuery(getUsersSchema)
  ],
  getUsersHandler
).GET

export const PATCH = createMethodRoute(
  'PATCH',
  [
    requireAuth(),
    requireRole(['ADMIN']),
    validateBody(updateUserRoleSchema)
  ],
  updateUserRoleHandler
).PATCH

export const DELETE = createMethodRoute(
  'DELETE',
  [
    requireAuth(),
    requireRole(['ADMIN'])
  ],
  deleteUserHandler
).DELETE