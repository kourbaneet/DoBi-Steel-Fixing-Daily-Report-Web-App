import { z } from 'zod'

export const createInvoiceSchema = z.object({
  weekStart: z.string().datetime('Invalid date format'),
})

export const updateInvoiceSchema = z.object({
  totalHours: z.number().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
  totalAmount: z.number().min(0).optional(),
  auditNote: z.string().min(1, 'Audit note is required when making changes').max(1000),
})

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'PAID']),
  auditNote: z.string().max(1000).optional(),
})