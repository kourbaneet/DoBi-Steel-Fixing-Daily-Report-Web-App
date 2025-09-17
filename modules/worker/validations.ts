import { z } from 'zod'

export const getWeeksSchema = z.object({
  page: z.number().min(1).default(1).optional(),
  limit: z.number().min(1).max(50).default(10).optional(),
})

export const getWeekDetailsSchema = z.object({
  week: z.string().regex(/^\d{4}-W\d{2}$/, 'Week must be in format YYYY-WW'),
})

export const createInvoiceSchema = z.object({
  weekStart: z.string().datetime('Invalid date format'),
})