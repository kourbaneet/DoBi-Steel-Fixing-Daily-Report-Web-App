import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/middleware/auth"
import { createMethodRoute } from "@/lib/middleware/compose"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { PRISMA } from "@/libs/prisma"

interface SupervisorDashboardData {
  kpis: {
    myDockets: number
    workersAdded: number
    totalHours: {
      dayLabour: number
      tonnage: number
      combined: number
    }
    pendingSignature: number
    mediaUploaded: number
  }
  charts: {
    hoursBySite: Array<{
      locationId: string
      locationLabel: string
      totalHours: number
    }>
    workTypeComposition: {
      dayLabour: number
      tonnage: number
    }
    topWorkers: Array<{
      contractorId: string
      nickname: string
      totalHours: number
    }>
  }
}

const getSupervisorDashboardHandler = async (req: ApiRequest) => {
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
    } else if (dateRange === "month") {
      // This month
      const today = new Date()
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
    } else if (dateRange === "quarter") {
      // This quarter
      const today = new Date()
      const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3
      startDate = new Date(today.getFullYear(), quarterStartMonth, 1)
      endDate = new Date(today.getFullYear(), quarterStartMonth + 3, 0, 23, 59, 59, 999)
    } else if (dateRange === "halfyear") {
      // This half year
      const today = new Date()
      const halfYearStartMonth = today.getMonth() < 6 ? 0 : 6
      startDate = new Date(today.getFullYear(), halfYearStartMonth, 1)
      endDate = new Date(today.getFullYear(), halfYearStartMonth + 6, 0, 23, 59, 59, 999)
    } else if (dateRange === "year") {
      // This year
      const today = new Date()
      startDate = new Date(today.getFullYear(), 0, 1)
      endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999)
    } else {
      // Default to month if unknown dateRange
      const today = new Date()
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
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

    // Fetch all supervisor's dockets in range with entries and media
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
      }
    })

    console.log(`Found ${dockets.length} dockets for supervisor ${supervisorId} with filters:`, {
      dateRange: `${startDate.toISOString()} to ${endDate.toISOString()}`,
      builderId,
      locationId
    })

    // Calculate KPIs
    const myDockets = dockets.length

    // Get unique contractor IDs
    const uniqueContractors = new Set<string>()
    let totalTonnageHours = 0
    let totalDayLabourHours = 0
    let totalMediaCount = 0

    dockets.forEach(docket => {
      // Count unique contractors
      docket.entries.forEach(entry => {
        uniqueContractors.add(entry.contractorId)
        totalTonnageHours += Number(entry.tonnageHours) || 0
        totalDayLabourHours += Number(entry.dayLabourHours) || 0
      })

      // Count media
      totalMediaCount += docket.media.length
    })

    const workersAdded = uniqueContractors.size
    const totalCombinedHours = totalTonnageHours + totalDayLabourHours

    // Count pending signatures (dockets without siteManagerSignatureUrl)
    const pendingSignature = dockets.filter(docket => !docket.siteManagerSignatureUrl).length

    // Chart Data Calculations
    // 1. Hours by Site (Top 5 locations)
    const locationHours = new Map<string, { locationId: string; locationLabel: string; totalHours: number }>()

    dockets.forEach(docket => {
      const locationId = docket.locationId
      const locationLabel = docket.location.label

      if (!locationHours.has(locationId)) {
        locationHours.set(locationId, {
          locationId,
          locationLabel,
          totalHours: 0
        })
      }

      const locationData = locationHours.get(locationId)!
      docket.entries.forEach(entry => {
        const hours = (Number(entry.tonnageHours) || 0) + (Number(entry.dayLabourHours) || 0)
        locationData.totalHours += hours
      })
    })

    const hoursBySite = Array.from(locationHours.values())
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 5)

    // 2. Work Type Composition
    const workTypeComposition = {
      dayLabour: totalDayLabourHours,
      tonnage: totalTonnageHours
    }

    // 3. Top Workers (Top 10)
    const workerHours = new Map<string, { contractorId: string; nickname: string; totalHours: number }>()

    dockets.forEach(docket => {
      docket.entries.forEach(entry => {
        const contractorId = entry.contractorId

        if (!workerHours.has(contractorId)) {
          workerHours.set(contractorId, {
            contractorId,
            nickname: 'Unknown', // Will be populated from contractor data
            totalHours: 0
          })
        }

        const workerData = workerHours.get(contractorId)!
        const hours = (Number(entry.tonnageHours) || 0) + (Number(entry.dayLabourHours) || 0)
        workerData.totalHours += hours
      })
    })

    // Get contractor nicknames
    const contractorIds = Array.from(workerHours.keys())
    const contractors = await PRISMA.contractor.findMany({
      where: { id: { in: contractorIds } },
      select: { id: true, nickname: true }
    })

    contractors.forEach(contractor => {
      const workerData = workerHours.get(contractor.id)
      if (workerData) {
        workerData.nickname = contractor.nickname
      }
    })

    const topWorkers = Array.from(workerHours.values())
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 10)

    const dashboardData: SupervisorDashboardData = {
      kpis: {
        myDockets,
        workersAdded,
        totalHours: {
          dayLabour: totalDayLabourHours,
          tonnage: totalTonnageHours,
          combined: totalCombinedHours
        },
        pendingSignature,
        mediaUploaded: totalMediaCount
      },
      charts: {
        hoursBySite,
        workTypeComposition,
        topWorkers
      }
    }

    return ApiResponseUtil.success(
      "Supervisor dashboard data retrieved successfully",
      dashboardData
    )

  } catch (error) {
    console.error("Error fetching supervisor dashboard data:", error)
    return ApiResponseUtil.serverError("Failed to fetch supervisor dashboard data")
  }
}

export const GET = createMethodRoute(
  'GET',
  [
    requireAuth(),
    requireRole(['SUPERVISOR', 'ADMIN']) // Admins can also access supervisor view
  ],
  getSupervisorDashboardHandler
).GET