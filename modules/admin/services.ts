import { PRISMA } from "@/libs/prisma"
import { Role } from '@prisma/client'
import { ADMIN_CONSTANTS } from './constants'
import { formatUserList, sanitizeAdminUser, buildUserSearchQuery, buildUserFilters } from './helpers'
import { 
  UpdateUserRoleInput, 
  updateUserRoleSchema
} from './validations'

export class AdminService {
  /**
   * Get list of users with filtering and pagination
   */
  static async getUsers(params: any) {
    // Don't validate here since the API handler already parsed the parameters
    const { 
      page = 1, 
      limit = 20, 
      role, 
      search, 
      emailVerified, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = params

    const skip = (page - 1) * limit
    
    let where: any = {}

    // Apply search filter
    if (search) {
      where = { ...where, ...buildUserSearchQuery(search) }
    }

    // Apply other filters
    const filters = buildUserFilters({ role, emailVerified })
    where = { ...where, ...filters }

    const [users, totalCount] = await Promise.all([
      PRISMA.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      PRISMA.user.count({ where })
    ])

    return {
      users: formatUserList(users),
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string) {
    const user = await PRISMA.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw new Error(ADMIN_CONSTANTS.ERRORS.USER_NOT_FOUND)
    }

    return sanitizeAdminUser(user)
  }

  /**
   * Update user role
   */
  static async updateUserRole(adminUserId: string, updateData: UpdateUserRoleInput) {
    const validatedData = updateUserRoleSchema.parse(updateData)
    const { userId, role } = validatedData

    // Check if trying to change own role
    if (userId === adminUserId) {
      throw new Error(ADMIN_CONSTANTS.ERRORS.CANNOT_CHANGE_OWN_ROLE)
    }

    // Check if target user exists
    const targetUser = await PRISMA.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) {
      throw new Error(ADMIN_CONSTANTS.ERRORS.USER_NOT_FOUND)
    }

    // Update user role
    const updatedUser = await PRISMA.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return sanitizeAdminUser(updatedUser)
  }

  /**
   * Delete user
   */
  static async deleteUser(adminUserId: string, userId: string) {
    // Check if trying to delete own account
    if (userId === adminUserId) {
      throw new Error("Cannot delete your own account")
    }

    // Check if target user exists
    const targetUser = await PRISMA.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) {
      throw new Error(ADMIN_CONSTANTS.ERRORS.USER_NOT_FOUND)
    }

    // Delete user
    await PRISMA.user.delete({
      where: { id: userId },
    })

    return { success: true, message: ADMIN_CONSTANTS.SUCCESS.USER_DELETED }
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats() {
    const [
      totalUsers,
      adminCount,
      supervisorCount,
      workerCount,
      recentSignups,
      pendingVerifications,
    ] = await Promise.all([
      PRISMA.user.count(),
      PRISMA.user.count({ where: { role: Role.ADMIN } }),
      PRISMA.user.count({ where: { role: Role.SUPERVISOR } }),
      PRISMA.user.count({ where: { role: Role.WORKER } }),
      PRISMA.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      PRISMA.user.count({
        where: {
          emailVerified: null,
        },
      }),
    ])

    return {
      totalUsers,
      adminCount,
      supervisorCount,
      workerCount,
      recentSignups,
      pendingVerifications,
    }
  }
}