import { z } from "zod"
import { MediaType } from "@prisma/client"
import { DOCKET_CONSTANTS } from "./constants"

const { PAGINATION, SORT, VALIDATION } = DOCKET_CONSTANTS

// Helper function to validate half-hour increments
const halfHourValidation = (value: number) => {
  return value >= VALIDATION.MIN_HOURS && value % VALIDATION.HOUR_INCREMENT === 0
}

export const docketIdSchema = z
  .string()
  .min(1, "Docket ID is required")
  .cuid("Invalid docket ID format")

export const docketEntrySchema = z.object({
  contractorId: z
    .string()
    .min(1, "Contractor is required")
    .cuid("Invalid contractor ID format"),
  tonnageHours: z
    .number()
    .min(VALIDATION.MIN_HOURS, "Tonnage hours cannot be negative")
    .max(VALIDATION.MAX_HOURS, "Tonnage hours cannot exceed 24")
    .refine(halfHourValidation, `Hours must be in ${VALIDATION.HOUR_INCREMENT} increments`)
    .default(0),
  dayLabourHours: z
    .number()
    .min(VALIDATION.MIN_HOURS, "Day labour hours cannot be negative")
    .max(VALIDATION.MAX_HOURS, "Day labour hours cannot exceed 24")
    .refine(halfHourValidation, `Hours must be in ${VALIDATION.HOUR_INCREMENT} increments`)
    .default(0),
}).refine(
  (data) => data.tonnageHours > 0 || data.dayLabourHours > 0,
  {
    message: "At least one type of hours must be greater than 0",
    path: ['tonnageHours'],
  }
)

export const docketMediaSchema = z.object({
  type: z.nativeEnum(MediaType),
  url: z
    .string()
    .url("Invalid media URL"),
  caption: z
    .string()
    .max(500, "Caption must be less than 500 characters")
    .optional()
    .transform((val) => (val && val.trim() !== '') ? val.trim() : null),
})

export const createDocketSchema = z.object({
  date: z
    .coerce.date()
    .refine((date) => date <= new Date(), "Date cannot be in the future"),
  builderId: z
    .string()
    .min(1, "Builder is required")
    .cuid("Invalid builder ID format"),
  locationId: z
    .string()
    .min(1, "Location is required")
    .cuid("Invalid location ID format"),
  scheduleNo: z
    .string()
    .max(100, "Schedule number must be less than 100 characters")
    .optional()
    .transform((val) => (val && val.trim() !== '') ? val.trim() : null),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .transform((val) => (val && val.trim() !== '') ? val.trim() : null),
  siteManagerName: z
    .string()
    .max(255, "Site manager name must be less than 255 characters")
    .optional()
    .transform((val) => (val && val.trim() !== '') ? val.trim() : null),
  siteManagerSignatureUrl: z
    .any()
    .optional()
    .transform((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        return val.trim()
      }
      return undefined
    }),
  entries: z
    .array(docketEntrySchema)
    .min(1, "At least one entry is required")
    .refine(
      (entries) => entries.some(entry => entry.tonnageHours > 0 || entry.dayLabourHours > 0),
      {
        message: "At least one entry must have hours greater than 0",
        path: ['entries'],
      }
    ),
  media: z
    .array(docketMediaSchema)
    .optional()
    .default([]),
})

export const updateDocketSchema = z.object({
  docketId: docketIdSchema,
  date: z
    .coerce.date()
    .refine((date) => date <= new Date(), "Date cannot be in the future")
    .optional(),
  builderId: z
    .string()
    .min(1, "Builder is required")
    .cuid("Invalid builder ID format")
    .optional(),
  locationId: z
    .string()
    .min(1, "Location is required")
    .cuid("Invalid location ID format")
    .optional(),
  scheduleNo: z
    .string()
    .max(100, "Schedule number must be less than 100 characters")
    .optional()
    .transform((val) => (val && val.trim() !== '') ? val.trim() : null),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .transform((val) => (val && val.trim() !== '') ? val.trim() : null),
  siteManagerName: z
    .string()
    .max(255, "Site manager name must be less than 255 characters")
    .optional()
    .transform((val) => (val && val.trim() !== '') ? val.trim() : null),
  siteManagerSignatureUrl: z
    .any()
    .optional()
    .transform((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        return val.trim()
      }
      return undefined
    }),
  entries: z
    .array(docketEntrySchema)
    .optional()
    .refine(
      (entries) => !entries || entries.length === 0 || entries.some(entry => entry.tonnageHours > 0 || entry.dayLabourHours > 0),
      {
        message: "If entries are provided, at least one must have hours greater than 0",
        path: ['entries'],
      }
    ),
  media: z
    .array(docketMediaSchema)
    .optional(),
})

export const getDocketsSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : PAGINATION.DEFAULT_PAGE)
    .refine((val) => !isNaN(val) && val >= 1, "Page must be at least 1"),
  limit: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : PAGINATION.DEFAULT_LIMIT)
    .refine((val) => !isNaN(val) && val >= 1 && val <= PAGINATION.MAX_LIMIT, 
      `Limit must be between 1 and ${PAGINATION.MAX_LIMIT}`),
  builderId: z
    .string()
    .cuid("Invalid builder ID format")
    .optional()
    .transform((val) => (val && val.trim() !== '') ? val.trim() : undefined),
  locationId: z
    .string()
    .cuid("Invalid location ID format")
    .optional()
    .transform((val) => (val && val.trim() !== '') ? val.trim() : undefined),
  supervisorId: z
    .string()
    .cuid("Invalid supervisor ID format")
    .optional()
    .transform((val) => (val && val.trim() !== '') ? val.trim() : undefined),
  startDate: z
    .string()
    .optional()
    .transform((val) => val ? new Date(val) : undefined)
    .refine((val) => !val || !isNaN(val.getTime()), "Invalid start date"),
  endDate: z
    .string()
    .optional()
    .transform((val) => val ? new Date(val) : undefined)
    .refine((val) => !val || !isNaN(val.getTime()), "Invalid end date"),
  sortBy: z
    .string()
    .optional()
    .refine((val) => !val || SORT.ALLOWED_SORT_FIELDS.includes(val), "Invalid sortBy field")
    .transform((val) => (val as any) || SORT.DEFAULT_SORT_BY),
  sortOrder: z
    .string()
    .optional()
    .refine((val) => !val || SORT.ALLOWED_SORT_ORDERS.includes(val), "Invalid sortOrder")
    .transform((val) => (val as 'asc' | 'desc') || SORT.DEFAULT_SORT_ORDER),
})

export const deleteDocketSchema = z.object({
  docketId: docketIdSchema,
})