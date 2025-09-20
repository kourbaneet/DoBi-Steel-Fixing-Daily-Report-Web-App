import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/middleware/auth"
import { composeMiddleware } from "@/lib/middleware/compose"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { PRISMA } from "@/libs/prisma"

interface WorkerDashboardData {
  kpis: {
    thisWeekHours: {
      dayLabour: number
      tonnage: number
      combined: number
    }
    estimatedPay: number
    hourlyRate: number
    docketsCounted: number
    sitesWorked: number
  }
  charts: {
    hoursByDay: Array<{
      day: string
      dayName: string
      dayLabour: number
      tonnage: number
      total: number
    }>
    sitesSummary: Array<{
      locationName: string
      builderName: string
      totalHours: number
      percentage: number
    }>
    weeklyTrend: Array<{
      weekStart: string
      weekLabel: string
      totalHours: number
      year: number
      weekNumber: number
    }>
  }
  tables: {
    weekBreakdown: Array<{
      date: string
      dayName: string
      companyCode: string
      locationLabel: string
      dayLabour: number
      tonnage: number
      total: number
      docketId: string
    }>
    recentInvoices: Array<{
      id: string
      weekLabel: string
      weekStart: string
      totalHours: number
      hourlyRate: number
      totalAmount: number
      status: string
      submittedAt: string | null
      paidAt: string | null
    }>
  }
  weekInfo: {
    weekNumber: number
    year: number
    startDate: string
    endDate: string
  }
}

const getWorkerDashboardHandler = async (req: ApiRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const weekParam = searchParams.get("week") // Format: YYYY-WXX

    // Get user ID from the authenticated user
    const userId = req.user?.id

    if (!userId) {
      return ApiResponseUtil.unauthorized("User ID not found")
    }

    // Get worker/contractor details by userId
    const worker = await PRISMA.contractor.findUnique({
      where: { userId: userId },
      select: {
        id: true,
        hourlyRate: true,
        nickname: true,
        email: true
      }
    })

    if (!worker) {
      return ApiResponseUtil.notFound("Worker/Contractor not found for this user")
    }

    // Parse week parameter or default to current week
    let weekNumber: number
    let year: number
    let startDate: Date
    let endDate: Date

    if (weekParam) {
      const [yearStr, weekStr] = weekParam.split('-W')
      year = parseInt(yearStr)
      weekNumber = parseInt(weekStr)
    } else {
      // Get current ISO week
      const today = new Date()
      year = today.getFullYear()
      weekNumber = getISOWeek(today)
    }

    // Calculate week start and end dates (Monday to Sunday)
    const weekDates = getWeekDates(year, weekNumber)
    startDate = weekDates.start
    endDate = weekDates.end

    console.log(`Fetching worker dashboard for ${worker.nickname} (${worker.id}) for week ${weekNumber}/${year}`, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    })

    // Get all docket entries for this worker in the specified week
    const docketEntries = await PRISMA.docketEntry.findMany({
      where: {
        contractorId: worker.id,
        docket: {
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      },
      include: {
        docket: {
          select: {
            id: true,
            date: true,
            locationId: true,
            location: {
              select: {
                label: true
              }
            },
            builder: {
              select: {
                name: true,
                companyCode: true
              }
            }
          }
        }
      }
    })

    // Calculate total hours and collect site information
    let totalDayLabour = 0
    let totalTonnage = 0
    const uniqueDockets = new Set<string>()
    const uniqueLocations = new Set<string>()

    docketEntries.forEach(entry => {
      totalDayLabour += Number(entry.dayLabourHours) || 0
      totalTonnage += Number(entry.tonnageHours) || 0
      uniqueDockets.add(entry.docket.id)
      uniqueLocations.add(entry.docket.locationId)
    })

    const totalCombined = totalDayLabour + totalTonnage
    const estimatedPay = totalCombined * (Number(worker.hourlyRate) || 0)

    // Generate chart and table data
    const chartData = await generateChartData(worker.id, docketEntries, weekNumber, year, startDate, endDate)
    const tableData = await generateTableData(worker.id, docketEntries)

    const dashboardData: WorkerDashboardData = {
      kpis: {
        thisWeekHours: {
          dayLabour: totalDayLabour,
          tonnage: totalTonnage,
          combined: totalCombined
        },
        estimatedPay,
        hourlyRate: Number(worker.hourlyRate) || 0,
        docketsCounted: uniqueDockets.size,
        sitesWorked: uniqueLocations.size
      },
      charts: chartData,
      tables: tableData,
      weekInfo: {
        weekNumber,
        year,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }
    }

    return ApiResponseUtil.success(
      "Worker dashboard data retrieved successfully",
      dashboardData
    )

  } catch (error) {
    console.error("Error fetching worker dashboard data:", error)
    return ApiResponseUtil.serverError("Failed to fetch worker dashboard data")
  }
}

// Helper function to get ISO week number
function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf())
  const dayNumber = (date.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNumber + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
}

// Helper function to get week start and end dates
function getWeekDates(year: number, week: number): { start: Date; end: Date } {
  // Get first day of the year
  const jan4 = new Date(year, 0, 4)
  const jan4Day = (jan4.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0

  // Calculate the Monday of week 1
  const week1Monday = new Date(jan4)
  week1Monday.setDate(jan4.getDate() - jan4Day)

  // Calculate the Monday of the target week
  const targetMonday = new Date(week1Monday)
  targetMonday.setDate(week1Monday.getDate() + (week - 1) * 7)
  targetMonday.setHours(0, 0, 0, 0)

  // Calculate Sunday
  const targetSunday = new Date(targetMonday)
  targetSunday.setDate(targetMonday.getDate() + 6)
  targetSunday.setHours(23, 59, 59, 999)

  return { start: targetMonday, end: targetSunday }
}

// Generate chart data for worker dashboard
async function generateChartData(workerId: string, docketEntries: any[], weekNumber: number, year: number, startDate: Date, endDate: Date) {
  // 1. Hours by Day (Mon-Sat)
  const hoursByDay = []
  const dailyData = new Map<string, { dayLabour: number; tonnage: number }>()

  // Initialize all days of the week
  for (let i = 0; i < 6; i++) { // Mon-Sat (6 days)
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const dayKey = date.toISOString().split('T')[0]
    dailyData.set(dayKey, { dayLabour: 0, tonnage: 0 })
  }

  // Aggregate hours by day
  docketEntries.forEach(entry => {
    const dayKey = entry.docket.date.toISOString().split('T')[0]
    if (dailyData.has(dayKey)) {
      const data = dailyData.get(dayKey)!
      data.dayLabour += Number(entry.dayLabourHours) || 0
      data.tonnage += Number(entry.tonnageHours) || 0
    }
  })

  // Convert to chart format
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  let dayIndex = 0
  for (const [dayKey, data] of dailyData) {
    hoursByDay.push({
      day: dayKey,
      dayName: dayNames[dayIndex] || `Day ${dayIndex + 1}`,
      dayLabour: data.dayLabour,
      tonnage: data.tonnage,
      total: data.dayLabour + data.tonnage
    })
    dayIndex++
  }

  // 2. Sites Summary (for donut chart)
  const sitesMap = new Map<string, { locationName: string; builderName: string; totalHours: number }>()

  docketEntries.forEach(entry => {
    const locationId = entry.docket.locationId
    const locationName = entry.docket.location?.label || 'Unknown Location'
    const builderName = entry.docket.builder?.name || 'Unknown Builder'
    const totalHours = (Number(entry.dayLabourHours) || 0) + (Number(entry.tonnageHours) || 0)

    if (sitesMap.has(locationId)) {
      sitesMap.get(locationId)!.totalHours += totalHours
    } else {
      sitesMap.set(locationId, {
        locationName,
        builderName,
        totalHours
      })
    }
  })

  const totalHoursAllSites = Array.from(sitesMap.values()).reduce((sum, site) => sum + site.totalHours, 0)
  const sitesSummary = Array.from(sitesMap.values()).map(site => ({
    ...site,
    percentage: totalHoursAllSites > 0 ? (site.totalHours / totalHoursAllSites) * 100 : 0
  }))

  // 3. Weekly Trend (last 6 weeks)
  const weeklyTrend = []

  for (let i = 5; i >= 0; i--) {
    let trendWeekNumber = weekNumber - i
    let trendYear = year

    // Handle year boundaries
    if (trendWeekNumber <= 0) {
      trendYear = year - 1
      const lastWeekOfPrevYear = getISOWeek(new Date(trendYear, 11, 31))
      trendWeekNumber = lastWeekOfPrevYear + trendWeekNumber
    }

    const trendWeekDates = getWeekDates(trendYear, trendWeekNumber)

    // Get docket entries for this week
    const trendEntries = await PRISMA.docketEntry.findMany({
      where: {
        contractorId: workerId,
        docket: {
          date: {
            gte: trendWeekDates.start,
            lte: trendWeekDates.end
          }
        }
      }
    })

    const trendTotalHours = trendEntries.reduce((sum, entry) =>
      sum + (Number(entry.dayLabourHours) || 0) + (Number(entry.tonnageHours) || 0), 0
    )

    weeklyTrend.push({
      weekStart: trendWeekDates.start.toISOString().split('T')[0],
      weekLabel: `W${trendWeekNumber}`,
      totalHours: trendTotalHours,
      year: trendYear,
      weekNumber: trendWeekNumber
    })
  }

  return {
    hoursByDay,
    sitesSummary,
    weeklyTrend
  }
}

// Generate table data for worker dashboard
async function generateTableData(workerId: string, docketEntries: any[]) {
  // 1. Week Breakdown Table
  const weekBreakdown = docketEntries.map(entry => {
    const date = new Date(entry.docket.date)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    return {
      date: date.toISOString().split('T')[0],
      dayName: dayNames[date.getDay()],
      companyCode: entry.docket.builder?.companyCode || 'N/A',
      locationLabel: entry.docket.location?.label || 'Unknown Location',
      dayLabour: Number(entry.dayLabourHours) || 0,
      tonnage: Number(entry.tonnageHours) || 0,
      total: (Number(entry.dayLabourHours) || 0) + (Number(entry.tonnageHours) || 0),
      docketId: entry.docket.id
    }
  }).sort((a, b) => a.date.localeCompare(b.date))

  // 2. Recent Invoices (last 5)
  const recentInvoices = await PRISMA.workerInvoice.findMany({
    where: {
      contractorId: workerId
    },
    orderBy: {
      weekStart: 'desc'
    },
    take: 5,
    select: {
      id: true,
      weekStart: true,
      weekEnd: true,
      totalHours: true,
      totalAmount: true,
      status: true,
      submittedAt: true,
      paidAt: true,
      pdfUrl: true,
      contractor: {
        select: {
          hourlyRate: true
        }
      }
    }
  })

  const recentInvoicesFormatted = recentInvoices.map(invoice => {
    const weekStart = new Date(invoice.weekStart)
    const year = weekStart.getFullYear()
    const weekNumber = getISOWeek(weekStart)

    return {
      id: invoice.id,
      weekLabel: `W${weekNumber}/${year}`,
      weekStart: invoice.weekStart.toISOString().split('T')[0],
      totalHours: Number(invoice.totalHours) || 0,
      hourlyRate: Number(invoice.contractor.hourlyRate) || 0,
      totalAmount: Number(invoice.totalAmount) || 0,
      status: invoice.status,
      submittedAt: invoice.submittedAt?.toISOString().split('T')[0] || null,
      paidAt: invoice.paidAt?.toISOString().split('T')[0] || null
    }
  })

  return {
    weekBreakdown,
    recentInvoices: recentInvoicesFormatted
  }
}

export async function GET(request: NextRequest) {
  const composedHandler = composeMiddleware(
    [
      requireAuth(),
      requireRole(['WORKER', 'ADMIN']) // Workers can access their own data, admins can access any
    ],
    getWorkerDashboardHandler
  )

  return composedHandler(request as ApiRequest)
}