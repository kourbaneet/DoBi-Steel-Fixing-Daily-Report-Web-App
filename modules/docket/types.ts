import { z } from 'zod'
import { Docket, DocketEntry, DocketMedia, Builder, BuilderLocation, User, Contractor } from '@prisma/client'
import { 
  createDocketSchema, 
  updateDocketSchema, 
  getDocketsSchema,
  deleteDocketSchema,
  docketEntrySchema,
  docketMediaSchema
} from './validations'

// Input types from validation schemas
export type CreateDocketInput = z.infer<typeof createDocketSchema>
export type UpdateDocketInput = z.infer<typeof updateDocketSchema>
export type GetDocketsInput = z.infer<typeof getDocketsSchema>
export type DeleteDocketInput = z.infer<typeof deleteDocketSchema>
export type DocketEntryInput = z.infer<typeof docketEntrySchema>
export type DocketMediaInput = z.infer<typeof docketMediaSchema>

// Enhanced types with relations
export type DocketWithRelations = Docket & {
  builder: Builder
  location: BuilderLocation
  supervisor: User
  entries: (DocketEntry & {
    contractor: Contractor
  })[]
  media: DocketMedia[]
}

export type DocketListItem = Docket & {
  builder: {
    id: string
    name: string
    companyCode: string
  }
  location: {
    id: string
    label: string
  }
  supervisor: {
    id: string
    name: string
  }
  _count: {
    entries: number
    media: number
  }
}

export type DocketDetail = DocketWithRelations

export interface GetDocketsResponse {
  dockets: DocketListItem[]
  page: number
  limit: number
  totalCount: number
  totalPages: number
}

export interface CreateDocketResponse {
  docket: DocketWithRelations
}

export interface UpdateDocketResponse {
  docket: DocketWithRelations
}

export interface GetDocketResponse {
  docket: DocketWithRelations
}

// Business logic types
export interface DocketPermissions {
  canView: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

export interface DocketFilters {
  builderId?: string
  locationId?: string
  supervisorId?: string
  startDate?: Date
  endDate?: Date
}

export interface DocketSortOptions {
  sortBy: 'date' | 'createdAt' | 'updatedAt'
  sortOrder: 'asc' | 'desc'
}