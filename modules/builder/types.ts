import { Builder, BuilderLocation } from '@prisma/client'
import { z } from 'zod'
import {
  createBuilderSchema,
  updateBuilderSchema,
  getBuildersSchema,
  createBuilderLocationSchema,
  updateBuilderLocationSchema
} from './validations'

export type CreateBuilderInput = z.infer<typeof createBuilderSchema>
export type UpdateBuilderInput = z.infer<typeof updateBuilderSchema>
export type GetBuildersInput = z.infer<typeof getBuildersSchema>
export type CreateBuilderLocationInput = z.infer<typeof createBuilderLocationSchema>
export type UpdateBuilderLocationInput = z.infer<typeof updateBuilderLocationSchema>

export type BuilderWithLocations = Builder & {
  locations: BuilderLocation[]
  _count?: {
    locations: number
  }
}

export type BuilderSummary = {
  id: string
  name: string
  companyCode: string
  phone: string | null
  address: string | null
  website: string | null
  contactPerson: string | null
  contactEmail: string | null
  createdAt: Date
  updatedAt: Date
  locationCount: number
}

export type BuilderDetail = BuilderWithLocations

export interface GetBuildersResponse {
  builders: BuilderSummary[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
}

export interface GetBuilderLocationsResponse {
  locations: BuilderLocation[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
}