import { PRISMA } from "@/libs/prisma"
import { Role, WorkerInvoiceStatus } from "@prisma/client"
import { startOfWeek, endOfWeek, subWeeks } from 'date-fns'
import { WORKER_CONSTANTS } from './constants'
import {
  WeekSummary,
  GetWeeksInput,
  GetWeeksResponse,
  GetWeekDetailsInput,
  GetWeekDetailsResponse,
  CreateInvoiceInput,
  CreateInvoiceResponse,
  WorkSiteEntry
} from './types'
import {
  parseWeekString,
  getWeekString,
  formatWeekSummary,
  formatWeekDetails,
  generateWeeksList,
  isCurrentOrPastWeek,
  calculateWeekTotals,
  startOfIsoWeekUTC,
  endOfIsoWeekUTC,
  iso,
  getWeekLabel
} from './helpers'

export class WorkerService {
  /**
   * Get list of weeks for the logged-in worker with status
   */
  static async getWeeks(params: GetWeeksInput, user: any): Promise<GetWeeksResponse> {
    if (!user) {
      throw new Error(WORKER_CONSTANTS.ERRORS.UNAUTHORIZED)
    }

    // Only WORKER role can access this endpoint
    if (user.role !== Role.WORKER) {
      throw new Error(WORKER_CONSTANTS.ERRORS.FORBIDDEN)
    }

    // Get contractor profile - try by userId first, then by email
    let contractor = await PRISMA.contractor.findUnique({
      where: { userId: user.id },
      select: { id: true, hourlyRate: true },
    })

    // If not found by userId, try to find by email and link it
    if (!contractor && user.email) {
      const contractorByEmail = await PRISMA.contractor.findUnique({
        where: { email: user.email },
      })

      // If found by email, link it to the user
      if (contractorByEmail && !contractorByEmail.userId) {
        contractor = await PRISMA.contractor.update({
          where: { id: contractorByEmail.id },
          data: { userId: user.id },
          select: { id: true, hourlyRate: true },
        })
      }
    }

    if (!contractor) {
      throw new Error(WORKER_CONSTANTS.ERRORS.CONTRACTOR_NOT_FOUND)
    }

    const { page = 1, limit = 12, weekStart: filterWeekStart, weekEnd: filterWeekEnd } = params

    // ----- compute date window -----
    let startWeekMonday: Date
    let endWeekMonday: Date

    if (filterWeekStart && filterWeekEnd) {
      // Filter for specific week
      startWeekMonday = new Date(filterWeekStart)
      endWeekMonday = new Date(filterWeekEnd)
      console.log('Filtering for specific week:', {
        filterWeekStart,
        filterWeekEnd,
        startWeekMonday: startWeekMonday.toISOString(),
        endWeekMonday: endWeekMonday.toISOString()
      })
    } else {
      // Default: show recent weeks
      const now = new Date()
      const toDate = now
      const fromDate = new Date(toDate)
      // Show last `page * limit` weeks (paged)
      const weeksToShow = page * limit
      fromDate.setUTCDate(toDate.getUTCDate() - weeksToShow * 7)

      // Normalize to ISO week boundaries (Monday..Sunday)
      endWeekMonday = startOfIsoWeekUTC(toDate)
      startWeekMonday = startOfIsoWeekUTC(fromDate)
    }

    // ----- load docket entries for this contractor in range -----
    let dateFilter: any

    if (filterWeekStart && filterWeekEnd) {
      // When filtering for specific week, use exact date range
      dateFilter = {
        gte: startWeekMonday,
        lte: endWeekMonday, // Use lte instead of lt for inclusive end
      }
      console.log('Using specific week filter:', dateFilter)
    } else {
      // Default range logic
      dateFilter = {
        gte: startWeekMonday,
        lt: new Date(endWeekMonday.getTime() + 7 * 24 * 3600 * 1000), // next Monday (exclusive)
      }
      console.log('Using default week range:', dateFilter)
    }

    const entries = await PRISMA.docketEntry.findMany({
      where: {
        contractorId: contractor.id,
        docket: {
          date: dateFilter,
        },
      },
      select: {
        tonnageHours: true,
        dayLabourHours: true,
        docket: {
          select: {
            date: true,
            builder: {
              select: {
                name: true,
                companyCode: true,
              }
            },
            location: {
              select: {
                id: true,
                label: true,
              }
            }
          }
        },
      },
      orderBy: [{ docket: { date: "desc" } }],
    })

    // Group by weekStart with location breakdown
    type LocationData = {
      locationId: string
      locationLabel: string
      companyCode: string
      dayLabourHours: number
      tonnageHours: number
      daysWorked: Set<string>
    }
    type WeekAgg = {
      weekStart: string
      hours: number
      dayLabourHours: number
      tonnageHours: number
      locations: Map<string, LocationData>
    }
    const map = new Map<string, WeekAgg>()

    for (const e of entries) {
      const d = e.docket.date
      const weekStart = iso(startOfIsoWeekUTC(d))
      const dayLabour = Number(e.dayLabourHours)
      const tonnage = Number(e.tonnageHours)
      const total = dayLabour + tonnage
      const dateStr = iso(d)

      if (!map.has(weekStart)) {
        map.set(weekStart, {
          weekStart,
          hours: 0,
          dayLabourHours: 0,
          tonnageHours: 0,
          locations: new Map()
        })
      }

      const weekData = map.get(weekStart)!
      weekData.hours += total
      weekData.dayLabourHours += dayLabour
      weekData.tonnageHours += tonnage

      // Track location breakdown
      const locationKey = `${e.docket.location.id}-${e.docket.builder.companyCode}`
      if (!weekData.locations.has(locationKey)) {
        weekData.locations.set(locationKey, {
          locationId: e.docket.location.id,
          locationLabel: e.docket.location.label,
          companyCode: e.docket.builder.companyCode,
          dayLabourHours: 0,
          tonnageHours: 0,
          daysWorked: new Set()
        })
      }

      const locationData = weekData.locations.get(locationKey)!
      locationData.dayLabourHours += dayLabour
      locationData.tonnageHours += tonnage
      locationData.daysWorked.add(dateStr)
    }

    // Build a list of weekStarts (desc), then paginate (unless filtering specific week)
    const weekKeysDesc = [...map.keys()].sort((a, b) => (a > b ? -1 : 1))

    let pagedKeys: string[]
    if (filterWeekStart && filterWeekEnd) {
      // When filtering for specific week, return all matching weeks (no pagination)
      pagedKeys = weekKeysDesc
    } else {
      // Normal pagination for default view
      const startIndex = (page - 1) * limit
      pagedKeys = weekKeysDesc.slice(startIndex, startIndex + limit)
    }

    // Get invoice statuses/snapshots
    let invoiceByWeek = new Map<string, { status: WorkerInvoiceStatus; totalHours: number; hourlyRate: number; totalAmount: number; id: string }>()
    const invoices = await PRISMA.workerInvoice.findMany({
      where: {
        contractorId: contractor.id,
        weekStart: { in: pagedKeys.map(k => new Date(`${k}T00:00:00.000Z`)) },
      },
      select: { id: true, weekStart: true, status: true, totalHours: true, hourlyRate: true, totalAmount: true },
    })

    for (const inv of invoices) {
      invoiceByWeek.set(iso(inv.weekStart), {
        status: inv.status,
        totalHours: Number(inv.totalHours),
        hourlyRate: Number(inv.hourlyRate),
        totalAmount: Number(inv.totalAmount),
        id: inv.id,
      })
    }

    // Build rows
    const weeks: WeekSummary[] = pagedKeys.map((weekStartStr) => {
      const weekStartDate = new Date(`${weekStartStr}T00:00:00.000Z`)

      // Use exact dates from filter if provided, otherwise calculate
      let weekEndDate: Date
      if (filterWeekStart && filterWeekEnd) {
        weekEndDate = new Date(filterWeekEnd)
        console.log('Using filtered week end date:', weekEndDate)
      } else {
        weekEndDate = endOfIsoWeekUTC(weekStartDate)
        console.log('Using calculated week end date:', weekEndDate)
      }

      const agg = map.get(weekStartStr)!
      const snapshot = invoiceByWeek.get(weekStartStr)

      const totalHours = (snapshot && snapshot.status !== WorkerInvoiceStatus.DRAFT) ? snapshot.totalHours : agg.hours
      const dayLabourHours = (snapshot && snapshot.status !== WorkerInvoiceStatus.DRAFT) ? 0 : agg.dayLabourHours // Only hide breakdown for submitted invoices
      const tonnageHours = (snapshot && snapshot.status !== WorkerInvoiceStatus.DRAFT) ? 0 : agg.tonnageHours // Only hide breakdown for submitted invoices
      const rate = snapshot ? snapshot.hourlyRate : Number(contractor.hourlyRate)
      const totalAmount = (snapshot && snapshot.status !== WorkerInvoiceStatus.DRAFT) ? snapshot.totalAmount : totalHours * rate
      const status = snapshot ? snapshot.status : WorkerInvoiceStatus.DRAFT
      const canSubmit = status === WorkerInvoiceStatus.DRAFT && totalHours > 0

      // Build location breakdown
      const locationBreakdown = Array.from(agg.locations.values()).map(location => ({
        locationLabel: location.locationLabel,
        companyCode: location.companyCode,
        dayLabourHours: location.dayLabourHours,
        tonnageHours: location.tonnageHours,
        totalHours: location.dayLabourHours + location.tonnageHours,
        totalAmount: (location.dayLabourHours + location.tonnageHours) * rate,
        daysWorked: location.daysWorked.size
      }))

      return {
        weekStart: weekStartDate.toISOString(),
        weekEnd: weekEndDate.toISOString(),
        weekLabel: getWeekLabel(weekStartDate, weekEndDate),
        totalHours: totalHours.toFixed(2),
        dayLabourHours: dayLabourHours.toFixed(2),
        tonnageHours: tonnageHours.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        status,
        invoiceId: snapshot?.id,
        canSubmit,
        locationBreakdown,
      }
    })

    return {
      weeks,
      page,
      limit,
      totalCount: weekKeysDesc.length,
      totalPages: Math.ceil(weekKeysDesc.length / limit),
    }
  }

  /**
   * Get detailed week information for the logged-in worker
   */
  static async getWeekDetails(params: GetWeekDetailsInput, user: any): Promise<GetWeekDetailsResponse> {
    if (!user) {
      throw new Error(WORKER_CONSTANTS.ERRORS.UNAUTHORIZED)
    }

    // Only WORKER role can access this endpoint
    if (user.role !== Role.WORKER) {
      throw new Error(WORKER_CONSTANTS.ERRORS.FORBIDDEN)
    }

    // Get contractor profile - try by userId first, then by email
    let contractor = await PRISMA.contractor.findUnique({
      where: { userId: user.id },
    })

    // If not found by userId, try to find by email and link it
    if (!contractor && user.email) {
      contractor = await PRISMA.contractor.findUnique({
        where: { email: user.email },
      })

      // If found by email, link it to the user
      if (contractor && !contractor.userId) {
        contractor = await PRISMA.contractor.update({
          where: { id: contractor.id },
          data: { userId: user.id },
        })
      }
    }

    if (!contractor) {
      throw new Error(WORKER_CONSTANTS.ERRORS.CONTRACTOR_NOT_FOUND)
    }

    // Parse week string
    const { weekStart, weekEnd } = parseWeekString(params.week)

    // Only allow access to current or past weeks
    if (!isCurrentOrPastWeek(weekStart)) {
      throw new Error(WORKER_CONSTANTS.ERRORS.FORBIDDEN)
    }

    // Get docket entries for this week
    const entries = await PRISMA.docketEntry.findMany({
      where: {
        contractorId: contractor.id,
        docket: {
          date: {
            gte: weekStart,
            lt: new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000) // Add 1 day to include Sunday
          }
        }
      },
      include: {
        docket: {
          include: {
            builder: {
              select: {
                id: true,
                name: true,
                companyCode: true,
              }
            },
            location: {
              select: {
                id: true,
                label: true,
              }
            }
          }
        }
      },
      orderBy: {
        docket: {
          date: 'asc'
        }
      }
    })

    // If no entries found, return empty week details instead of throwing error
    if (entries.length === 0) {
      const details = {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        weekLabel: getWeekLabel(weekStart, weekEnd),
        hourlyRate: Number(contractor.hourlyRate).toFixed(2),
        entries: [] as WorkSiteEntry[],
        totalHours: "0.00",
        totalAmount: "0.00",
        status: WorkerInvoiceStatus.DRAFT,
        invoiceId: undefined as string | undefined,
        canSubmit: false,
      }

      return {
        details,
      }
    }

    // Check if invoice exists for this week
    const existingInvoice = await PRISMA.workerInvoice.findUnique({
      where: {
        contractorId_weekStart: {
          contractorId: contractor.id,
          weekStart: weekStart,
        }
      }
    })

    const status = existingInvoice?.status || WorkerInvoiceStatus.DRAFT
    const invoiceId = existingInvoice?.id

    const details = formatWeekDetails(
      weekStart,
      weekEnd,
      Number(contractor.hourlyRate),
      entries,
      status,
      invoiceId
    )

    return {
      details,
    }
  }
}