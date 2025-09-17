import { z } from 'zod'

export const getDocketsHistorySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  builderId: z.string().optional(),
  locationId: z.string().optional(),
  supervisorId: z.string().optional(),
  contractorId: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(500).optional(),
})

export const getPaymentsHistorySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  contractorId: z.string().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'PAID']).optional(),
  q: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(500).optional(),
})

export const exportDocketsSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  builderId: z.string().optional(),
  locationId: z.string().optional(),
  supervisorId: z.string().optional(),
  contractorId: z.string().optional(),
  q: z.string().optional(),
  format: z.enum(['csv', 'xlsx']).default('csv'),
})

export const exportPaymentsSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  contractorId: z.string().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'PAID']).optional(),
  q: z.string().optional(),
  format: z.enum(['csv', 'xlsx']).default('csv'),
})