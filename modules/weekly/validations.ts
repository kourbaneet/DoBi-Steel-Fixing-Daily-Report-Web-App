import { z } from 'zod'
import { WEEKLY_CONSTANTS } from './constants'

// Helper to validate ISO week format (YYYY-Www)
const weekFormatRegex = /^\d{4}-W\d{1,2}$/

// Helper to validate date format (YYYY-MM-DD)
const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/

export const getWeeklySchema = z.object({
  week: z
    .string()
    .optional()
    .refine((val) => !val || weekFormatRegex.test(val), {
      message: "Week must be in format YYYY-Www (e.g., 2025-W36)"
    }),
  weekStart: z
    .string()
    .optional()
    .refine((val) => !val || dateFormatRegex.test(val), {
      message: "Week start must be in format YYYY-MM-DD"
    })
    .refine((val) => {
      if (!val) return true
      const date = new Date(`${val}T00:00:00.000Z`)
      return !isNaN(date.getTime())
    }, {
      message: "Invalid date format"
    }),
  builderId: z
    .string()
    .cuid("Invalid builder ID format")
    .optional(),
  locationId: z
    .string()
    .cuid("Invalid location ID format")
    .optional(),
  q: z
    .string()
    .max(100, "Search query must be less than 100 characters")
    .optional()
    .transform((val) => (val && val.trim() !== '') ? val.trim().toLowerCase() : undefined),
}).refine((data) => data.week || data.weekStart, {
  message: "Either 'week' or 'weekStart' parameter is required",
  path: ['week'],
})

export const weeklyExportSchema = z.object({
  week: z
    .string()
    .optional()
    .refine((val) => !val || weekFormatRegex.test(val), {
      message: "Week must be in format YYYY-Www (e.g., 2025-W36)"
    }),
  weekStart: z
    .string()
    .optional()
    .refine((val) => !val || dateFormatRegex.test(val), {
      message: "Week start must be in format YYYY-MM-DD"
    })
    .refine((val) => {
      if (!val) return true
      const date = new Date(`${val}T00:00:00.000Z`)
      return !isNaN(date.getTime())
    }, {
      message: "Invalid date format"
    }),
  builderId: z
    .string()
    .cuid("Invalid builder ID format")
    .optional(),
  locationId: z
    .string()
    .cuid("Invalid location ID format")
    .optional(),
  q: z
    .string()
    .max(100, "Search query must be less than 100 characters")
    .optional()
    .transform((val) => (val && val.trim() !== '') ? val.trim().toLowerCase() : undefined),
  format: z
    .enum(['csv', 'xlsx'])
    .optional()
    .default('csv'),
}).refine((data) => data.week || data.weekStart, {
  message: "Either 'week' or 'weekStart' parameter is required",
  path: ['week'],
})

// Validation for manual week range creation
export const weekRangeSchema = z.object({
  weekStart: z.date(),
  weekEnd: z.date(),
}).refine((data) => data.weekStart < data.weekEnd, {
  message: "Week start must be before week end",
  path: ['weekEnd'],
})

// Schema for internal aggregation data validation
export const weeklyRowDataSchema = z.object({
  contractorId: z.string().cuid(),
  nickname: z.string().min(1),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  fullName: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  builderId: z.string().cuid(),
  builderName: z.string().min(1),
  companyCode: z.string().min(1),
  locationId: z.string().cuid(),
  locationLabel: z.string().min(1),
  days: z.array(z.number().min(0)).length(6), // Mon-Sat
  tonnage: z.number().min(0),
  dayLabour: z.number().min(0),
  rate: z.number().min(0),
})