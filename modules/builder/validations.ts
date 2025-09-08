import { z } from "zod"
import { BUILDER_CONSTANTS } from "./constants"

const { PAGINATION, SORT } = BUILDER_CONSTANTS

export const builderIdSchema = z
  .string()
  .min(1, "Builder ID is required")
  .cuid("Invalid builder ID format")

export const locationIdSchema = z
  .string()
  .min(1, "Location ID is required")
  .cuid("Invalid location ID format")

export const createBuilderSchema = z.object({
  name: z
    .string()
    .min(1, "Builder name is required")
    .max(255, "Builder name must be less than 255 characters")
    .trim(),
  companyCode: z
    .string()
    .min(1, "Company code is required")
    .max(50, "Company code must be less than 50 characters")
    .trim()
    .regex(/^[A-Za-z0-9_-]+$/, "Company code must contain only letters, numbers, hyphens, and underscores"),
  abn: z
    .string()
    .max(20, "ABN must be less than 20 characters")
    .optional()
    .transform((val) => (val && val.trim() !== '') ? val.trim() : null),
  phone: z
    .string()
    .max(30, "Phone must be less than 30 characters")
    .optional()
    .transform((val) => (val && val.trim() !== '') ? val.trim() : null),
  address: z
    .string()
    .max(500, "Address must be less than 500 characters")
    .optional()
    .transform((val) => (val && val.trim() !== '') ? val.trim() : null),
  website: z
    .string()
    .max(255, "Website must be less than 255 characters")
    .optional()
    .transform((val) => (val && val.trim() !== '') ? val.trim() : null),
  supervisorRate: z
    .number()
    .positive("Supervisor rate must be positive")
    .max(9999999.99, "Supervisor rate is too large")
    .optional()
    .or(z.string().transform((val) => {
      if (!val || val.trim() === '') return undefined
      const num = parseFloat(val)
      return isNaN(num) ? undefined : num
    })),
  tieHandRate: z
    .number()
    .positive("Tie hand rate must be positive")
    .max(9999999.99, "Tie hand rate is too large")
    .optional()
    .or(z.string().transform((val) => {
      if (!val || val.trim() === '') return undefined
      const num = parseFloat(val)
      return isNaN(num) ? undefined : num
    })),
  tonnageRate: z
    .number()
    .positive("Tonnage rate must be positive")
    .max(9999999.99, "Tonnage rate is too large")
    .optional()
    .or(z.string().transform((val) => {
      if (!val || val.trim() === '') return undefined
      const num = parseFloat(val)
      return isNaN(num) ? undefined : num
    })),
  contactPerson: z
    .string()
    .max(255, "Contact person must be less than 255 characters")
    .optional()
    .transform((val) => (val && val.trim() !== '') ? val.trim() : null),
  contactEmail: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .transform((val) => (val && val.trim() !== '') ? val.trim().toLowerCase() : null),
})

export const updateBuilderSchema = z.object({
  builderId: builderIdSchema,
  ...createBuilderSchema.omit({ companyCode: true }).shape,
  companyCode: createBuilderSchema.shape.companyCode.optional(),
})

export const getBuildersSchema = z.object({
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
  search: z
    .string()
    .optional()
    .transform((val) => (val && val.trim() !== '') ? val.trim() : undefined),
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

export const deleteBuilderSchema = z.object({
  builderId: builderIdSchema,
})

export const createBuilderLocationSchema = z.object({
  builderId: builderIdSchema,
  label: z
    .string()
    .min(1, "Location label is required")
    .max(255, "Location label must be less than 255 characters")
    .trim(),
  address: z
    .string()
    .max(500, "Address must be less than 500 characters")
    .optional()
    .transform((val) => (val && val.trim() !== '') ? val.trim() : null),
})

export const updateBuilderLocationSchema = z.object({
  builderId: builderIdSchema,
  locationId: locationIdSchema,
  label: z
    .string()
    .min(1, "Location label is required")
    .max(255, "Location label must be less than 255 characters")
    .trim(),
  address: z
    .string()
    .max(500, "Address must be less than 500 characters")
    .optional()
    .transform((val) => (val && val.trim() !== '') ? val.trim() : null),
})

export const deleteBuilderLocationSchema = z.object({
  builderId: builderIdSchema,
  locationId: locationIdSchema,
})