import { requireAuth, requireRole } from "@/lib/middleware/auth"
import { createMethodRoute } from "@/lib/middleware/compose"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { PRISMA } from "@/libs/prisma"

// GET handler - Get all locations for dropdowns
const getLocationsHandler = async (req: ApiRequest) => {
  try {
    const locations = await PRISMA.builderLocation.findMany({
      select: {
        id: true,
        label: true,
        builder: {
          select: {
            name: true,
            companyCode: true
          }
        }
      },
      orderBy: {
        label: 'asc'
      }
    })

    // Transform to simpler format for dropdowns
    const formattedLocations = locations.map(location => ({
      id: location.id,
      label: location.label,
      builderName: location.builder.name,
      builderCode: location.builder.companyCode
    }))

    return ApiResponseUtil.success(
      'Locations retrieved successfully',
      formattedLocations
    )
  } catch (error) {
    console.error("Error fetching locations:", error)
    return ApiResponseUtil.serverError('Failed to fetch locations')
  }
}

// Create route with middleware
export const GET = createMethodRoute(
  'GET',
  [
    requireAuth(),
    requireRole(['ADMIN', 'SUPERVISOR'])
  ],
  getLocationsHandler
).GET