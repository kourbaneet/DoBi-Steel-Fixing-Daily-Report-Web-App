import { Contractor, User } from "@prisma/client"

export interface ContractorSummary {
  id: string
  nickname: string
  firstName?: string | null
  lastName?: string | null
  fullName?: string | null
  email?: string | null
  phone?: string | null
  position?: string | null
  hourlyRate: number
  abn?: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ContractorWithUser extends Contractor {
  user?: User | null
}

export interface CreateContractorData {
  nickname: string
  firstName?: string
  lastName?: string
  fullName?: string
  email?: string
  phone?: string
  position?: string
  experience?: string
  hourlyRate: number
  abn?: string
  bankName?: string
  bsb?: string
  accountNo?: string
  homeAddress?: string
  active: boolean
}

export interface UpdateContractorData extends Partial<CreateContractorData> {
  id: string
}

export interface ContractorSearchParams {
  search?: string
  position?: string
  active?: boolean
  page?: number
  limit?: number
  sortBy?: keyof Contractor
  sortOrder?: 'asc' | 'desc'
}

export interface ContractorListResponse {
  contractors: ContractorSummary[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
}