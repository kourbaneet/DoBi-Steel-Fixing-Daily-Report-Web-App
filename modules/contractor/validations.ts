import { z } from "zod"

export const createContractorSchema = z.object({
  nickname: z.string().min(1, "Nickname is required").max(50, "Nickname too long"),
  firstName: z.string().max(50, "First name too long").optional(),
  lastName: z.string().max(50, "Last name too long").optional(),
  fullName: z.string().max(100, "Full name too long").optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(30, "Phone number too long").optional(),
  position: z.string().max(100, "Position too long").optional(),
  experience: z.string().max(500, "Experience too long").optional(),
  hourlyRate: z.number().min(0, "Hourly rate must be positive"),
  abn: z.string().max(20, "ABN too long").optional(),
  bankName: z.string().max(100, "Bank name too long").optional(),
  bsb: z.string().max(10, "BSB too long").optional(),
  accountNo: z.string().max(32, "Account number too long").optional(),
  homeAddress: z.string().max(500, "Address too long").optional(),
  active: z.boolean().optional().default(true),
})

export const updateContractorSchema = createContractorSchema.partial().extend({
  id: z.string().min(1, "ID is required"),
})

export const contractorSearchSchema = z.object({
  search: z.string().optional(),
  position: z.string().optional(),
  active: z.boolean().optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),
  sortBy: z.enum([
    "nickname",
    "firstName", 
    "lastName",
    "fullName",
    "email",
    "position",
    "hourlyRate",
    "abn",
    "active",
    "createdAt",
    "updatedAt"
  ]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
})

export type CreateContractorInput = z.infer<typeof createContractorSchema>
export type UpdateContractorInput = z.infer<typeof updateContractorSchema>
export type ContractorSearchInput = z.infer<typeof contractorSearchSchema>