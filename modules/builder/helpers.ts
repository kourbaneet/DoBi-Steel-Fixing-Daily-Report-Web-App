import { Builder, BuilderLocation } from '@prisma/client'
import { BuilderSummary, BuilderWithLocations } from './types'

export function sanitizeBuilder(builder: any): BuilderSummary {
  return {
    id: builder.id,
    name: builder.name,
    companyCode: builder.companyCode,
    phone: builder.phone,
    address: builder.address,
    website: builder.website,
    contactPerson: builder.contactPerson,
    contactEmail: builder.contactEmail,
    createdAt: builder.createdAt,
    updatedAt: builder.updatedAt,
    locationCount: builder._count?.locations || 0,
  }
}

export function sanitizeBuilderDetail(builder: BuilderWithLocations): BuilderWithLocations {
  return {
    ...builder,
    locations: builder.locations || [],
  }
}

export function formatBuilderList(builders: any[]): BuilderSummary[] {
  return builders.map(sanitizeBuilder)
}

export function buildBuilderSearchQuery(search: string) {
  return {
    OR: [
      {
        name: {
          contains: search,
          mode: 'insensitive' as const,
        },
      },
      {
        companyCode: {
          contains: search,
          mode: 'insensitive' as const,
        },
      },
      {
        contactPerson: {
          contains: search,
          mode: 'insensitive' as const,
        },
      },
      {
        contactEmail: {
          contains: search,
          mode: 'insensitive' as const,
        },
      },
    ],
  }
}

export function buildBuilderFilters(filters: any) {
  const where: any = {}
  
  // Add more filters as needed
  return where
}

export function sanitizeBuilderLocation(location: BuilderLocation): BuilderLocation {
  return location
}

export function formatBuilderLocationList(locations: BuilderLocation[]): BuilderLocation[] {
  return locations.map(sanitizeBuilderLocation)
}

export function buildLocationSearchQuery(search: string) {
  return {
    OR: [
      {
        label: {
          contains: search,
          mode: 'insensitive' as const,
        },
      },
      {
        address: {
          contains: search,
          mode: 'insensitive' as const,
        },
      },
    ],
  }
}