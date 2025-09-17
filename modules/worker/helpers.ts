import { format, parse, isValid, setISOWeek, setISOWeekYear, startOfISOWeek, endOfISOWeek, getISOWeek, getISOWeekYear, subWeeks, startOfWeek } from 'date-fns'
import { WorkerInvoiceStatus } from '@prisma/client'
import { WORKER_CONSTANTS } from './constants'
import { WeekSummary, WeekDetails, WorkSiteEntry } from './types'

// ISO Week helpers (Monday = start of week)
export function startOfIsoWeekUTC(d: Date): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = date.getUTCDay() || 7 // 1..7 (Mon..Sun)
  if (day !== 1) date.setUTCDate(date.getUTCDate() - (day - 1))
  return date // Monday 00:00 UTC
}

export function endOfIsoWeekUTC(weekStart: Date): Date {
  const end = new Date(weekStart)
  end.setUTCDate(end.getUTCDate() + 6) // Sunday
  return end
}

export function iso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function parseWeekString(weekString: string): { weekStart: Date; weekEnd: Date } {
  try {
    // Parse week string like "2025-W38" to get Monday of that week
    const weekMatch = weekString.match(/^(\d{4})-W(\d{1,2})$/)

    if (!weekMatch) {
      throw new Error(WORKER_CONSTANTS.ERRORS.INVALID_WEEK_FORMAT)
    }

    const year = parseInt(weekMatch[1], 10)
    const week = parseInt(weekMatch[2], 10)

    if (week < 1 || week > 53) {
      throw new Error(WORKER_CONSTANTS.ERRORS.INVALID_WEEK_FORMAT)
    }

    // Create a date for the given ISO week
    let date = new Date(year, 0, 4) // Jan 4th is always in week 1
    date = setISOWeekYear(date, year)
    date = setISOWeek(date, week)

    const weekStart = startOfIsoWeekUTC(date)
    const weekEnd = endOfIsoWeekUTC(weekStart)

    return { weekStart, weekEnd }
  } catch (error) {
    throw new Error(WORKER_CONSTANTS.ERRORS.INVALID_WEEK_FORMAT)
  }
}

export function getWeekString(date: Date): string {
  const year = getISOWeekYear(date)
  const week = getISOWeek(date).toString().padStart(2, '0')
  return `${year}-W${week}`
}

export function getWeekLabel(weekStart: Date, weekEnd: Date): string {
  const startFormatted = format(weekStart, 'MMM dd')
  const endFormatted = format(weekEnd, 'MMM dd, yyyy')
  return `${startFormatted} - ${endFormatted}`
}

export function calculateWeekTotals(entries: any[]): { totalHours: number; totalAmount: number } {
  let totalHours = 0

  for (const entry of entries) {
    const tonnageHours = Number(entry.tonnageHours) || 0
    const dayLabourHours = Number(entry.dayLabourHours) || 0
    totalHours += tonnageHours + dayLabourHours
  }

  return { totalHours, totalAmount: 0 } // Amount will be calculated with rate
}

export function formatWeekSummary(
  weekStart: Date,
  weekEnd: Date,
  totalHours: number,
  hourlyRate: number,
  status: WorkerInvoiceStatus,
  invoiceId?: string
): WeekSummary {
  const totalAmount = totalHours * hourlyRate
  const canSubmit = status === WorkerInvoiceStatus.DRAFT && totalHours > 0

  return {
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    weekLabel: getWeekLabel(weekStart, weekEnd),
    totalHours: totalHours.toFixed(WORKER_CONSTANTS.FORMATS.DECIMAL_PLACES),
    totalAmount: totalAmount.toFixed(WORKER_CONSTANTS.FORMATS.DECIMAL_PLACES),
    status,
    invoiceId,
    canSubmit,
  }
}

export function formatWeekDetails(
  weekStart: Date,
  weekEnd: Date,
  hourlyRate: number,
  entries: any[],
  status: WorkerInvoiceStatus,
  invoiceId?: string
): WeekDetails {
  const workSiteEntries: WorkSiteEntry[] = entries.map(entry => {
    const tonnageHours = Number(entry.tonnageHours) || 0
    const dayLabourHours = Number(entry.dayLabourHours) || 0
    const totalHours = tonnageHours + dayLabourHours

    return {
      builderId: entry.docket.builderId,
      builderName: entry.docket.builder.name,
      companyCode: entry.docket.builder.companyCode,
      locationId: entry.docket.locationId,
      locationLabel: entry.docket.location.label,
      date: format(entry.docket.date, WORKER_CONSTANTS.FORMATS.DATE_FORMAT),
      tonnageHours: tonnageHours.toFixed(WORKER_CONSTANTS.FORMATS.DECIMAL_PLACES),
      dayLabourHours: dayLabourHours.toFixed(WORKER_CONSTANTS.FORMATS.DECIMAL_PLACES),
      totalHours: totalHours.toFixed(WORKER_CONSTANTS.FORMATS.DECIMAL_PLACES),
    }
  })

  const { totalHours } = calculateWeekTotals(entries)
  const totalAmount = totalHours * hourlyRate
  const canSubmit = status === WorkerInvoiceStatus.DRAFT && totalHours > 0

  return {
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    weekLabel: getWeekLabel(weekStart, weekEnd),
    hourlyRate: hourlyRate.toFixed(WORKER_CONSTANTS.FORMATS.DECIMAL_PLACES),
    entries: workSiteEntries,
    totalHours: totalHours.toFixed(WORKER_CONSTANTS.FORMATS.DECIMAL_PLACES),
    totalAmount: totalAmount.toFixed(WORKER_CONSTANTS.FORMATS.DECIMAL_PLACES),
    status,
    invoiceId,
    canSubmit,
  }
}

export function generateWeeksList(startDate: Date, numberOfWeeks: number): Date[] {
  const weeks: Date[] = []
  let currentWeek = startDate

  for (let i = 0; i < numberOfWeeks; i++) {
    weeks.push(new Date(currentWeek))
    currentWeek = subWeeks(currentWeek, 1)
  }

  return weeks
}

export function isCurrentOrPastWeek(weekStart: Date): boolean {
  const now = new Date()
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 })
  return weekStart <= currentWeekStart
}