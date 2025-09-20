import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/middleware/auth"
import { createMethodRoute } from "@/lib/middleware/compose"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { PRISMA } from "@/libs/prisma"

interface DocketEntry {
  id: string
  date: string
  builder: {
    companyCode: string
    name: string
  }
  location: {
    label: string
  }
  workerCount: number
  totalHours: {
    dayLabour: number
    tonnage: number
    combined: number
  }
  mediaCount: number
  hasSignature: boolean
  status: 'draft' | 'submitted' | 'signed'
}

const getSupervisorDocketsHandler = async (req: ApiRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const dateRange = searchParams.get("dateRange") || "today"
    const builderId = searchParams.get("builderId")
    const locationId = searchParams.get("locationId")

    // Get supervisor ID from the authenticated user
    const supervisorId = req.user?.id

    if (!supervisorId) {
      return ApiResponseUtil.unauthorized("Supervisor ID not found")
    }

    // Calculate date range
    let startDate: Date
    let endDate: Date

    if (dateRange === "today") {
      startDate = new Date()
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date()
      endDate.setHours(23, 59, 59, 999)
    } else if (dateRange === "week") {
      // This week (Monday to Sunday)
      const today = new Date()
      const day = today.getDay()
      const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Monday start
      startDate = new Date(today.setDate(diff))
      startDate.setHours(0, 0, 0, 0)

      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
    } else {
      // Default to today if unknown dateRange
      startDate = new Date()
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date()
      endDate.setHours(23, 59, 59, 999)
    }

    // Build where clause for dockets
    const whereClause: any = {
      date: {
        gte: startDate,
        lte: endDate
      },
      supervisorId: supervisorId
    }

    // Add optional filters
    if (builderId) {
      whereClause.builderId = builderId
    }

    if (locationId) {
      whereClause.locationId = locationId
    }

    // Fetch dockets with related data
    const dockets = await PRISMA.docket.findMany({
      where: whereClause,
      include: {
        entries: {
          select: {
            contractorId: true,
            tonnageHours: true,
            dayLabourHours: true
          }
        },
        media: {
          select: {
            id: true
          }
        },
        builder: {
          select: {
            name: true,
            companyCode: true
          }
        },
        location: {
          select: {
            label: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    console.log(`Found ${dockets.length} dockets for supervisor ${supervisorId} with filters:`, {
      dateRange: `${startDate.toISOString()} to ${endDate.toISOString()}`,
      builderId,
      locationId
    })

    // Transform dockets to the expected format
    const transformedDockets: DocketEntry[] = dockets.map(docket => {
      // Count unique workers
      const uniqueWorkers = new Set(docket.entries.map(entry => entry.contractorId))

      // Calculate total hours
      let totalDayLabour = 0
      let totalTonnage = 0
      docket.entries.forEach(entry => {
        totalDayLabour += Number(entry.dayLabourHours) || 0
        totalTonnage += Number(entry.tonnageHours) || 0
      })

      return {
        id: docket.id,
        date: docket.date.toISOString().split('T')[0],
        builder: {
          companyCode: docket.builder.companyCode,
          name: docket.builder.name
        },
        location: {
          label: docket.location.label
        },
        workerCount: uniqueWorkers.size,
        totalHours: {
          dayLabour: totalDayLabour,
          tonnage: totalTonnage,
          combined: totalDayLabour + totalTonnage
        },
        mediaCount: docket.media.length,
        hasSignature: !!docket.siteManagerSignatureUrl,
        status: (docket as any).status as 'draft' | 'submitted' | 'signed'
      }
    })

    return ApiResponseUtil.success(
      "Supervisor dockets retrieved successfully",
      transformedDockets
    )

  } catch (error) {
    console.error("Error fetching supervisor dockets:", error)
    return ApiResponseUtil.serverError("Failed to fetch supervisor dockets")
  }
}

export const GET = createMethodRoute(
  'GET',
  [
    requireAuth(),
    requireRole(['SUPERVISOR', 'ADMIN']) // Admins can also access supervisor view
  ],
  getSupervisorDocketsHandler
).GET