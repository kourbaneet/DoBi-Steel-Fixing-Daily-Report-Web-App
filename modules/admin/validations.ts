import { z } from "zod"
import { Role } from "@prisma/client"

export const roleSchema = z.nativeEnum(Role)

export const userIdSchema = z
  .string()
  .min(1, "User ID is required")
  .cuid("Invalid user ID format")

export const updateUserRoleSchema = z.object({
  userId: userIdSchema,
  role: roleSchema,
  reason: z
    .string()
    .max(500, "Reason must be less than 500 characters")
    .optional(),
})

export const getUsersSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 1)
    .refine((val) => !isNaN(val) && val >= 1, "Page must be at least 1"),
  limit: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 20)
    .refine((val) => !isNaN(val) && val >= 1 && val <= 100, "Limit must be between 1 and 100"),
  role: z
    .string()
    .optional()
    .refine((val) => !val || val === '' || Object.values(Role).includes(val as Role), "Invalid role")
    .transform((val) => (val && val !== '') ? val as Role : undefined),
  search: z
    .string()
    .optional()
    .transform((val) => (val && val !== '') ? val : undefined),
  emailVerified: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "true") return true
      if (val === "false") return false
      return undefined
    }),
  sortBy: z
    .string()
    .optional()
    .refine((val) => !val || ['createdAt', 'updatedAt', 'name', 'email'].includes(val), "Invalid sortBy")
    .transform((val) => (val as 'createdAt' | 'updatedAt' | 'name' | 'email') || 'createdAt'),
  sortOrder: z
    .string()
    .optional()
    .refine((val) => !val || ['asc', 'desc'].includes(val), "Invalid sortOrder")
    .transform((val) => (val as 'asc' | 'desc') || 'desc'),
})

export const deleteUserSchema = z.object({
  userId: userIdSchema,
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must be less than 500 characters"),
})

export const suspendUserSchema = z.object({
  userId: userIdSchema,
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must be less than 500 characters"),
  duration: z
    .number()
    .int()
    .min(1, "Duration must be at least 1 day")
    .max(365, "Duration cannot exceed 365 days")
    .optional(),
})

export const bulkUpdateUsersSchema = z.object({
  userIds: z
    .array(userIdSchema)
    .min(1, "At least one user ID is required")
    .max(50, "Cannot update more than 50 users at once"),
  role: roleSchema,
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must be less than 500 characters"),
})

export const inviteUserSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .toLowerCase()
    .transform((val) => val.trim()),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .transform((val) => val.trim()),
  role: roleSchema.default(Role.WORKER),
})

// Types derived from schemas
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>
export type GetUsersInput = z.infer<typeof getUsersSchema>
export type DeleteUserInput = z.infer<typeof deleteUserSchema>
export type SuspendUserInput = z.infer<typeof suspendUserSchema>
export type BulkUpdateUsersInput = z.infer<typeof bulkUpdateUsersSchema>
export type InviteUserInput = z.infer<typeof inviteUserSchema>