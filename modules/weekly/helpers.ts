import { 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  format, 
  parseISO, 
  getISOWeek, 
  getISOWeekYear,
  startOfISOWeek,
  isValid
} from 'date-fns'
import { WeekRange, WeeklyAggregationRow, WeeklyRow } from './types'
import { WEEKLY_CONSTANTS } from './constants'

/**
 * Parse week parameters to get date range
 */
export function parseWeekParams(week?: string, weekStart?: string): WeekRange {
  if (weekStart) {
    const start = parseISO(`${weekStart}T00:00:00.000Z`)
    if (!isValid(start)) {
      throw new Error(WEEKLY_CONSTANTS.ERRORS.INVALID_WEEK_START)
    }
    const end = addDays(start, 7) // exclusive next Monday
    return { start, end }
  }

  if (!week) {
    throw new Error(WEEKLY_CONSTANTS.ERRORS.INVALID_WEEK_FORMAT)
  }

  // Parse ISO week format (2025-W36)
  const match = week.match(/^(\d{4})-W(\d{1,2})$/)
  if (!match) {
    throw new Error(WEEKLY_CONSTANTS.ERRORS.INVALID_WEEK_FORMAT)
  }

  const year = Number(match[1])
  const weekNum = Number(match[2])
  
  if (!year || !weekNum || weekNum < 1 || weekNum > 53) {
    throw new Error(WEEKLY_CONSTANTS.ERRORS.INVALID_WEEK_FORMAT)
  }

  // Get first day of the year and find the Monday of the specified ISO week
  const firstDayOfYear = new Date(year, 0, 1)
  const start = startOfISOWeek(addDays(firstDayOfYear, (weekNum - 1) * 7))
  const end = addDays(start, 7) // Exclusive next Monday

  return { start, end }
}

/**
 * Map JS Date to Monday-Saturday index (0-5). Returns -1 for Sunday
 */
export function dayIndexMonSat(date: Date): number {
  const dayOfWeek = date.getUTCDay() // 0=Sunday, 1=Monday, ..., 6=Saturday
  if (dayOfWeek === 0) return -1 // Ignore Sunday
  return dayOfWeek - 1 // Monday=0, ..., Saturday=5
}

/**
 * Format aggregated weekly data into response rows
 */
export function formatWeeklyRows(aggregationRows: WeeklyAggregationRow[]): WeeklyRow[] {
  return aggregationRows
    .sort((a, b) => a.nickname.localeCompare(b.nickname))
    .map(row => {
      const totalHours = row.days.reduce((sum, hours) => sum + hours, 0)
      const totalAmount = totalHours * (row.rate || 0)

      return {
        contractorId: row.contractorId,
        nickname: row.nickname,
        firstName: row.firstName,
        lastName: row.lastName,
        fullName: row.fullName,
        email: row.email,
        builderId: row.builderId,
        builderName: row.builderName,
        companyCode: row.companyCode,
        locationId: row.locationId,
        locationLabel: row.locationLabel,
        mon: row.days[0].toFixed(WEEKLY_CONSTANTS.FORMATS.DECIMAL_PLACES),
        tue: row.days[1].toFixed(WEEKLY_CONSTANTS.FORMATS.DECIMAL_PLACES),
        wed: row.days[2].toFixed(WEEKLY_CONSTANTS.FORMATS.DECIMAL_PLACES),
        thu: row.days[3].toFixed(WEEKLY_CONSTANTS.FORMATS.DECIMAL_PLACES),
        fri: row.days[4].toFixed(WEEKLY_CONSTANTS.FORMATS.DECIMAL_PLACES),
        sat: row.days[5].toFixed(WEEKLY_CONSTANTS.FORMATS.DECIMAL_PLACES),
        tonnageHours: row.tonnage.toFixed(WEEKLY_CONSTANTS.FORMATS.DECIMAL_PLACES),
        dayLabourHours: row.dayLabour.toFixed(WEEKLY_CONSTANTS.FORMATS.DECIMAL_PLACES),
        totalHours: totalHours.toFixed(WEEKLY_CONSTANTS.FORMATS.DECIMAL_PLACES),
        rate: (row.rate || 0).toFixed(WEEKLY_CONSTANTS.FORMATS.DECIMAL_PLACES),
        totalAmount: totalAmount.toFixed(WEEKLY_CONSTANTS.FORMATS.DECIMAL_PLACES),
      }
    })
}

/**
 * Calculate totals for weekly rows
 */
export function calculateWeeklyTotals(rows: WeeklyRow[]) {
  return rows.reduce(
    (acc, row) => {
      acc.hours += Number(row.totalHours)
      acc.amount += Number(row.totalAmount)
      return acc
    },
    { hours: 0, amount: 0 }
  )
}

/**
 * Check if contractor matches search query
 */
export function matchesSearchQuery(contractor: any, query?: string): boolean {
  if (!query) return true
  
  const searchTerm = query.toLowerCase()
  const nickname = (contractor.nickname || '').toLowerCase()
  const fullName = (contractor.fullName || '').toLowerCase()
  const firstName = (contractor.firstName || '').toLowerCase()
  const lastName = (contractor.lastName || '').toLowerCase()
  const email = (contractor.email || '').toLowerCase()
  
  return nickname.includes(searchTerm) || 
         fullName.includes(searchTerm) ||
         firstName.includes(searchTerm) ||
         lastName.includes(searchTerm) ||
         email.includes(searchTerm)
}

/**
 * Format date range for display
 */
export function formatWeekRange(start: Date, end: Date): { weekStart: string, weekEnd: string } {
  const weekStart = format(start, 'yyyy-MM-dd') // Monday
  // End is exclusive, so subtract 1 day to get Sunday
  const weekEnd = format(addDays(end, -1), 'yyyy-MM-dd') // Sunday
  
  return { weekStart, weekEnd }
}

/**
 * Generate unique key for contractor-builder-location combination
 */
export function generateAggregationKey(contractorId: string, builderId: string, locationId: string): string {
  return `${contractorId}::${builderId}::${locationId}`
}

/**
 * Get display name for contractor
 */
export function getContractorDisplayName(contractor: any): string {
  if (contractor.fullName) return contractor.fullName
  if (contractor.firstName || contractor.lastName) {
    return `${contractor.firstName || ''} ${contractor.lastName || ''}`.trim()
  }
  return contractor.nickname || 'Unknown'
}

/**
 * Convert date to ISO week string (YYYY-Www)
 */
export function formatISOWeek(date: Date): string {
  const year = getISOWeekYear(date)
  const week = getISOWeek(date)
  return `${year}-W${week.toString().padStart(2, '0')}`
}

/**
 * Get Monday of current week
 */
export function getCurrentWeekStart(): Date {
  return startOfISOWeek(new Date())
}

/**
 * Get formatted current week string
 */
export function getCurrentWeekString(): string {
  return formatISOWeek(new Date())
}