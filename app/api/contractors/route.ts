import { requireAuth, requireRole } from "@/lib/middleware/auth"
import { createMethodRoute } from "@/lib/middleware/compose"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { PRISMA } from "@/libs/prisma"

// GET handler - Get all contractors for dropdowns
const getContractorsHandler = async (req: ApiRequest) => {
  try {
    const contractors = await PRISMA.contractor.findMany({
      where: {
        active: true
      },
      select: {
        id: true,
        nickname: true,
        fullName: true,
        email: true
      },
      orderBy: {
        nickname: 'asc'
      }
    })

    return ApiResponseUtil.success(
      'Contractors retrieved successfully',
      contractors
    )
  } catch (error) {
    console.error("Error fetching contractors:", error)
    return ApiResponseUtil.serverError('Failed to fetch contractors')
  }
}

// Create route with middleware
export const GET = createMethodRoute(
  'GET',
  [
    requireAuth(),
    requireRole(['ADMIN', 'SUPERVISOR'])
  ],
  getContractorsHandler
).GET