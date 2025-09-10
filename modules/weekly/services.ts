import { PRISMA } from '@/libs/prisma'
import { Role } from '@prisma/client'
import { WEEKLY_CONSTANTS } from './constants'
import { 
  GetWeeklyInput, 
  GetWeeklyResponse, 
  WeeklyAggregationRow,
  WeeklyPayload 
} from './types'
import { 
  parseWeekParams,
  dayIndexMonSat,
  formatWeeklyRows,
  calculateWeeklyTotals,
  matchesSearchQuery,
  formatWeekRange,
  generateAggregationKey
} from './helpers'

export class WeeklyService {
  /**
   * Get weekly timesheet data with aggregation
   */
  static async getWeeklyData(params: GetWeeklyInput, user: any): Promise<GetWeeklyResponse> {
    if (!user) {
      throw new Error(WEEKLY_CONSTANTS.ERRORS.UNAUTHORIZED)
    }

    // Only ADMIN and SUPERVISOR can view weekly timesheets
    if (user.role !== Role.ADMIN && user.role !== Role.SUPERVISOR) {
      throw new Error(WEEKLY_CONSTANTS.ERRORS.FORBIDDEN)
    }

    const { week, weekStart, builderId, locationId, q } = params

    try {
      // Parse week parameters to get date range
      const { start, end } = parseWeekParams(week, weekStart)

      // Build where clause for dockets
      let where: any = {
        date: { gte: start, lt: end },
      }

      // Apply builder filter
      if (builderId) {
        where.builderId = builderId
      }

      // Apply location filter  
      if (locationId) {
        where.locationId = locationId
      }

      // If user is SUPERVISOR, only show their dockets
      if (user.role === Role.SUPERVISOR) {
        where.supervisorId = user.id
      }

      // Fetch dockets with entries and related data
      const dockets = await PRISMA.docket.findMany({
        where,
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
          },
          entries: {
            include: {
              contractor: {
                select: {
                  id: true,
                  nickname: true,
                  firstName: true,
                  lastName: true,
                  fullName: true,
                  email: true,
                  hourlyRate: true,
                  active: true,
                }
              }
            }
          }
        },
        orderBy: [{ date: 'asc' }],
      })

      // Aggregate data by contractor-builder-location
      const aggregationMap = new Map<string, WeeklyAggregationRow>()

      for (const docket of dockets) {
        for (const entry of docket.entries) {
          // Apply search filter
          if (!matchesSearchQuery(entry.contractor, q)) {
            continue
          }

          // Get day index (0=Monday, 5=Saturday, -1=Sunday)
          const dayIndex = dayIndexMonSat(docket.date)
          if (dayIndex < 0) continue // Skip Sundays

          const key = generateAggregationKey(entry.contractorId, docket.builderId, docket.locationId)
          
          if (!aggregationMap.has(key)) {
            aggregationMap.set(key, {
              contractorId: entry.contractorId,
              nickname: entry.contractor.nickname,
              firstName: entry.contractor.firstName,
              lastName: entry.contractor.lastName,
              fullName: entry.contractor.fullName,
              email: entry.contractor.email,
              builderId: docket.builderId,
              builderName: docket.builder.name,
              companyCode: docket.builder.companyCode,
              locationId: docket.locationId,
              locationLabel: docket.location.label,
              days: [0, 0, 0, 0, 0, 0], // Mon-Sat
              tonnage: 0,
              dayLabour: 0,
              rate: Number(entry.contractor.hourlyRate) || 0,
            })
          }

          const row = aggregationMap.get(key)!
          const tonnageHours = Number(entry.tonnageHours) || 0
          const dayLabourHours = Number(entry.dayLabourHours) || 0
          
          // Add hours to the specific day
          row.days[dayIndex] += (tonnageHours + dayLabourHours)
          
          // Add to weekly totals
          row.tonnage += tonnageHours
          row.dayLabour += dayLabourHours
        }
      }

      // Convert aggregation map to array and format
      const aggregationRows = Array.from(aggregationMap.values())
      const formattedRows = formatWeeklyRows(aggregationRows)
      
      // Calculate totals
      const totals = calculateWeeklyTotals(formattedRows)
      
      // Format date range
      const { weekStart: formattedWeekStart, weekEnd: formattedWeekEnd } = formatWeekRange(start, end)

      const payload: WeeklyPayload = {
        weekStart: formattedWeekStart,
        weekEnd: formattedWeekEnd,
        rows: formattedRows,
        totals: {
          hours: totals.hours.toFixed(WEEKLY_CONSTANTS.FORMATS.DECIMAL_PLACES),
          amount: totals.amount.toFixed(WEEKLY_CONSTANTS.FORMATS.DECIMAL_PLACES),
        },
      }

      return { data: payload }

    } catch (error) {
      console.error('Error fetching weekly data:', error)
      if (error instanceof Error && error.message.includes('Invalid')) {
        throw error // Re-throw validation errors
      }
      throw new Error(WEEKLY_CONSTANTS.ERRORS.SERVER_ERROR)
    }
  }

  /**
   * Get available builders for filtering
   */
  static async getAvailableBuilders(user: any) {
    if (!user || (user.role !== Role.ADMIN && user.role !== Role.SUPERVISOR)) {
      return []
    }

    try {
      const builders = await PRISMA.builder.findMany({
        select: {
          id: true,
          name: true,
          companyCode: true,
        },
        orderBy: { name: 'asc' },
      })

      return builders
    } catch (error) {
      console.error('Error fetching builders for weekly filter:', error)
      return []
    }
  }

  /**
   * Get available locations for a specific builder
   */
  static async getAvailableLocations(builderId: string, user: any) {
    if (!user || (user.role !== Role.ADMIN && user.role !== Role.SUPERVISOR)) {
      return []
    }

    try {
      const locations = await PRISMA.builderLocation.findMany({
        where: { builderId },
        select: {
          id: true,
          label: true,
        },
        orderBy: { label: 'asc' },
      })

      return locations
    } catch (error) {
      console.error('Error fetching locations for weekly filter:', error)
      return []
    }
  }
}