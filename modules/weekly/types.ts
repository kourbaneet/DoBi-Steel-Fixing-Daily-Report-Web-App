import { InvoiceStatus, WeeklyDay } from './constants'

export interface WeeklyRow {
  contractorId: string
  nickname: string
  firstName?: string | null
  lastName?: string | null
  fullName?: string | null
  email?: string | null
  builderId: string
  builderName: string
  companyCode: string
  locationId: string
  locationLabel: string
  
  // hours per day (Mon..Sat)
  mon: string
  tue: string
  wed: string
  thu: string
  fri: string
  sat: string
  
  tonnageHours: string      // totals for the week
  dayLabourHours: string
  totalHours: string
  rate: string              // contractor.hourlyRate
  totalAmount: string       // totalHours * rate
  
  status?: InvoiceStatus    // if WorkerInvoice exists
}

export interface WeeklyTotals {
  hours: string
  amount: string
}

export interface WeeklyPayload {
  weekStart: string         // YYYY-MM-DD (Monday)
  weekEnd: string          // YYYY-MM-DD (Sunday)
  rows: WeeklyRow[]
  totals: WeeklyTotals
}

export interface GetWeeklyInput {
  week?: string            // ISO week (e.g. 2025-W36)
  weekStart?: string       // Monday date YYYY-MM-DD
  builderId?: string       // Filter by builder
  locationId?: string      // Filter by location  
  q?: string              // Search nickname/fullName/email
}

export interface GetWeeklyResponse {
  data: WeeklyPayload
}

export interface WeeklyExportInput extends GetWeeklyInput {
  format?: 'csv' | 'xlsx'
}

export interface WeekRange {
  start: Date              // Monday 00:00:00 UTC
  end: Date               // Next Monday 00:00:00 UTC (exclusive)
}

export interface WeeklyAggregationRow {
  contractorId: string
  nickname: string
  firstName?: string | null
  lastName?: string | null
  fullName?: string | null
  email?: string | null
  builderId: string
  builderName: string
  companyCode: string
  locationId: string
  locationLabel: string
  days: number[]          // 6 elements for Mon..Sat
  tonnage: number
  dayLabour: number
  rate: number
}