import { requireAuth, requireRole } from "@/lib/middleware/auth"
import { createMethodRoute } from "@/lib/middleware/compose"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { PRISMA } from "@/libs/prisma"

// GET handler - Get all builders for dropdowns
const getBuildersHandler = async (req: ApiRequest) => {
  try {
    const builders = await PRISMA.builder.findMany({
      select: {
        id: true,
        name: true,
        companyCode: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return ApiResponseUtil.success(
      'Builders retrieved successfully',
      builders
    )
  } catch (error) {
    console.error("Error fetching builders:", error)
    return ApiResponseUtil.serverError('Failed to fetch builders')
  }
}

// Create route with middleware
export const GET = createMethodRoute(
  'GET',
  [
    requireAuth(),
    requireRole(['ADMIN', 'SUPERVISOR'])
  ],
  getBuildersHandler
).GET