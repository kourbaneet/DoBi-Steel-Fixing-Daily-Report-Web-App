import { WorkerInvoiceStatus } from "@prisma/client"

export interface GetWeeksInput {
  page?: number
  limit?: number
  weekStart?: string // ISO date string for filtering specific week
  weekEnd?: string   // ISO date string for filtering specific week
}

export interface LocationBreakdown {
  locationLabel: string
  companyCode: string
  dayLabourHours: number
  tonnageHours: number
  totalHours: number
  totalAmount: number
  daysWorked: number
}

export interface WeekSummary {
  weekStart: string
  weekEnd: string
  weekLabel: string
  totalHours: string
  dayLabourHours: string
  tonnageHours: string
  totalAmount: string
  status: WorkerInvoiceStatus
  invoiceId?: string
  canSubmit: boolean
  locationBreakdown: LocationBreakdown[]
}

export interface GetWeeksResponse {
  weeks: WeekSummary[]
  page: number
  limit: number
  totalCount: number
  totalPages: number
}

export interface GetWeekDetailsInput {
  week: string
}

export interface WorkSiteEntry {
  builderId: string
  builderName: string
  companyCode: string
  locationId: string
  locationLabel: string
  date: string
  tonnageHours: string
  dayLabourHours: string
  totalHours: string
}

export interface WeekDetails {
  weekStart: string
  weekEnd: string
  weekLabel: string
  hourlyRate: string
  entries: WorkSiteEntry[]
  totalHours: string
  totalAmount: string
  status: WorkerInvoiceStatus
  invoiceId?: string
  canSubmit: boolean
}

export interface GetWeekDetailsResponse {
  details: WeekDetails
}

export interface CreateInvoiceInput {
  weekStart: string
}

export interface CreateInvoiceResponse {
  success: boolean
  invoiceId: string
  message: string
}