import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/middleware/auth"
import { createMethodRoute } from "@/lib/middleware/compose"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { PRISMA } from "@/libs/prisma"

interface SiteOperation {
  locationId: string
  locationLabel: string
  builderId: string
  builderCode: string
  builderName: string
  status: 'not-started' | 'in-progress' | 'completed' | 'needs-attention'
  workersOnSite: number
  currentHours: {
    dayLabour: number
    tonnage: number
    combined: number
  }
  mediaCount: number
  lastUpdate: Date | null
  docketId: string | null
  alerts: string[]
}

interface SiteOperationsData {
  activeSites: SiteOperation[]
  summary: {
    totalActiveSites: number
    totalWorkers: number
    sitesWithIssues: number
  }
}

const getSiteOperationsHandler = async (req: ApiRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const builderId = searchParams.get("builderId")
    const locationId = searchParams.get("locationId")

    // Get supervisor ID from the authenticated user
    const supervisorId = req.user?.id

    if (!supervisorId) {
      return ApiResponseUtil.unauthorized("Supervisor ID not found")
    }

    // Get today's date range
    const today = new Date()
    const startDate = new Date(today)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(today)
    endDate.setHours(23, 59, 59, 999)

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

    // Get all locations that the supervisor has access to (from builders they work with)
    const supervisorBuilders = await PRISMA.builder.findMany({
      where: builderId ? { id: builderId } : {},
      include: {
        locations: {
          where: locationId ? { id: locationId } : {},
          orderBy: { label: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Get all dockets for today with entries and media
    const todaysDockets = await PRISMA.docket.findMany({
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
            id: true,
            name: true,
            companyCode: true
          }
        },
        location: {
          select: {
            id: true,
            label: true
          }
        }
      }
    })

    console.log(`Found ${todaysDockets.length} dockets for supervisor ${supervisorId}`)

    // Create site operations data
    const siteOperationsMap = new Map<string, SiteOperation>()

    // Initialize all accessible locations
    supervisorBuilders.forEach(builder => {
      builder.locations.forEach(location => {
        siteOperationsMap.set(location.id, {
          locationId: location.id,
          locationLabel: location.label,
          builderId: builder.id,
          builderCode: builder.companyCode,
          builderName: builder.name,
          status: 'not-started',
          workersOnSite: 0,
          currentHours: {
            dayLabour: 0,
            tonnage: 0,
            combined: 0
          },
          mediaCount: 0,
          lastUpdate: null,
          docketId: null,
          alerts: []
        })
      })
    })

    // Process today's dockets to update site operations
    todaysDockets.forEach(docket => {
      const siteOp = siteOperationsMap.get(docket.locationId)
      if (!siteOp) return

      // Update basic info
      siteOp.docketId = docket.id
      siteOp.lastUpdate = docket.updatedAt

      // Count unique workers
      const uniqueWorkers = new Set(docket.entries.map(entry => entry.contractorId))
      siteOp.workersOnSite = uniqueWorkers.size

      // Sum hours
      let totalDayLabour = 0
      let totalTonnage = 0
      docket.entries.forEach(entry => {
        totalDayLabour += Number(entry.dayLabourHours) || 0
        totalTonnage += Number(entry.tonnageHours) || 0
      })
      siteOp.currentHours = {
        dayLabour: totalDayLabour,
        tonnage: totalTonnage,
        combined: totalDayLabour + totalTonnage
      }

      // Count media
      siteOp.mediaCount = docket.media.length

      // Determine status and alerts
      if (siteOp.workersOnSite === 0 && siteOp.currentHours.combined === 0) {
        siteOp.status = 'needs-attention'
        siteOp.alerts.push('No activity today')
      } else if (siteOp.currentHours.combined > 0) {
        siteOp.status = 'in-progress'
      } else {
        siteOp.status = 'not-started'
      }

      // Additional alerts
      if (siteOp.workersOnSite === 0 && siteOp.currentHours.combined > 0) {
        siteOp.alerts.push('Hours logged but no workers assigned')
      }
      if (siteOp.mediaCount === 0 && siteOp.currentHours.combined > 0) {
        siteOp.alerts.push('No photos uploaded')
      }
    })

    // Convert map to array and filter active sites
    const activeSites = Array.from(siteOperationsMap.values())
      .filter(site => site.docketId || site.status !== 'not-started')
      .sort((a, b) => {
        // Sort by status priority (needs attention first), then by last update
        const statusPriority = { 'needs-attention': 0, 'in-progress': 1, 'completed': 2, 'not-started': 3 }
        const aPriority = statusPriority[a.status] || 3
        const bPriority = statusPriority[b.status] || 3

        if (aPriority !== bPriority) return aPriority - bPriority

        if (a.lastUpdate && b.lastUpdate) {
          return new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime()
        }
        return a.locationLabel.localeCompare(b.locationLabel)
      })

    // Calculate summary
    const summary = {
      totalActiveSites: activeSites.length,
      totalWorkers: activeSites.reduce((sum, site) => sum + site.workersOnSite, 0),
      sitesWithIssues: activeSites.filter(site => site.status === 'needs-attention' || site.alerts.length > 0).length
    }

    const siteOperationsData: SiteOperationsData = {
      activeSites,
      summary
    }

    return ApiResponseUtil.success(
      "Site operations data retrieved successfully",
      siteOperationsData
    )

  } catch (error) {
    console.error("Error fetching site operations data:", error)
    return ApiResponseUtil.serverError("Failed to fetch site operations data")
  }
}

export const GET = createMethodRoute(
  'GET',
  [
    requireAuth(),
    requireRole(['SUPERVISOR', 'ADMIN']) // Admins can also access supervisor view
  ],
  getSiteOperationsHandler
).GET