import { Role } from '@prisma/client'
import { Session } from 'next-auth'
import { isAdmin, isSupervisor } from '@/lib/auth-utils'
import { 
  DocketWithRelations, 
  DocketListItem, 
  DocketFilters,
  DocketPermissions 
} from './types'

/**
 * Format dockets list for API response
 */
export function formatDocketList(dockets: any[]): DocketListItem[] {
  return dockets.map(docket => ({
    ...docket,
    builder: {
      id: docket.builder.id,
      name: docket.builder.name,
      companyCode: docket.builder.companyCode,
    },
    location: {
      id: docket.location.id,
      label: docket.location.label,
    },
    supervisor: {
      id: docket.supervisor.id,
      name: docket.supervisor.name || docket.supervisor.email || 'Unknown Supervisor',
    }
  }))
}

/**
 * Sanitize docket detail for API response
 */
export function sanitizeDocketDetail(docket: any): DocketWithRelations {
  return {
    ...docket,
    entries: docket.entries?.map((entry: any) => ({
      ...entry,
      contractor: {
        ...entry.contractor,
        // Remove sensitive data if needed
        bankName: undefined,
        bsb: undefined,
        accountNo: undefined,
        homeAddress: undefined,
      }
    })) || []
  }
}

/**
 * Build search query for dockets
 */
export function buildDocketSearchQuery(search: string) {
  return {
    OR: [
      {
        scheduleNo: {
          contains: search,
          mode: 'insensitive' as const,
        }
      },
      {
        description: {
          contains: search,
          mode: 'insensitive' as const,
        }
      },
      {
        siteManagerName: {
          contains: search,
          mode: 'insensitive' as const,
        }
      },
      {
        builder: {
          name: {
            contains: search,
            mode: 'insensitive' as const,
          }
        }
      },
      {
        builder: {
          companyCode: {
            contains: search,
            mode: 'insensitive' as const,
          }
        }
      },
      {
        location: {
          label: {
            contains: search,
            mode: 'insensitive' as const,
          }
        }
      }
    ]
  }
}

/**
 * Build filters for docket queries
 */
export function buildDocketFilters(filters: DocketFilters) {
  const where: any = {}

  if (filters.builderId) {
    where.builderId = filters.builderId
  }

  if (filters.locationId) {
    where.locationId = filters.locationId
  }

  if (filters.supervisorId) {
    where.supervisorId = filters.supervisorId
  }

  if (filters.startDate || filters.endDate) {
    where.date = {}
    if (filters.startDate) {
      where.date.gte = filters.startDate
    }
    if (filters.endDate) {
      where.date.lte = filters.endDate
    }
  }

  return where
}

/**
 * Build authorization filter based on user role and permissions
 */
export function buildAuthorizationFilter({ user }: { user: any }) {
  if (!user) {
    return { id: { equals: 'never-match' } } // Block all access
  }

  // Admin has access to all dockets
  if (user.role === Role.ADMIN) {
    return {}
  }

  // Supervisor can only access their own dockets
  if (user.role === Role.SUPERVISOR) {
    return { 
      supervisorId: user.id 
    }
  }

  // Workers have no access
  return { id: { equals: 'never-match' } }
}

/**
 * Check if user can perform specific action on docket
 */
export function getDocketPermissions({ user }: { user: any }, docket?: DocketWithRelations): DocketPermissions {
  if (!user) {
    return {
      canView: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
    }
  }

  const userRole = user.role

  // Admin has full access
  if (userRole === Role.ADMIN) {
    return {
      canView: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
    }
  }

  // Supervisor can CRUD their own dockets
  if (userRole === Role.SUPERVISOR) {
    const isOwnDocket = !docket || docket.supervisorId === user.id

    return {
      canView: isOwnDocket,
      canCreate: true, // Can create dockets for themselves
      canUpdate: isOwnDocket,
      canDelete: isOwnDocket,
    }
  }

  // Workers have no access
  return {
    canView: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  }
}

/**
 * Calculate total hours for a docket
 */
export function calculateTotalHours(docket: DocketWithRelations) {
  if (!docket.entries) return { tonnageHours: 0, dayLabourHours: 0, totalHours: 0 }

  const totals = docket.entries.reduce(
    (acc, entry) => ({
      tonnageHours: acc.tonnageHours + Number(entry.tonnageHours),
      dayLabourHours: acc.dayLabourHours + Number(entry.dayLabourHours),
    }),
    { tonnageHours: 0, dayLabourHours: 0 }
  )

  return {
    ...totals,
    totalHours: totals.tonnageHours + totals.dayLabourHours,
  }
}

/**
 * Validate that entries have valid contractors and hours
 */
export function validateDocketEntries(entries: any[]): string[] {
  const errors: string[] = []

  if (!entries || entries.length === 0) {
    errors.push('At least one entry is required')
    return errors
  }

  const hasValidEntry = entries.some(entry => 
    (entry.tonnageHours > 0 || entry.dayLabourHours > 0)
  )

  if (!hasValidEntry) {
    errors.push('At least one entry must have hours greater than 0')
  }

  entries.forEach((entry, index) => {
    if (!entry.contractorId) {
      errors.push(`Entry ${index + 1}: Contractor is required`)
    }

    if (entry.tonnageHours < 0) {
      errors.push(`Entry ${index + 1}: Tonnage hours cannot be negative`)
    }

    if (entry.dayLabourHours < 0) {
      errors.push(`Entry ${index + 1}: Day labour hours cannot be negative`)
    }

    // Validate half-hour increments
    if (entry.tonnageHours % 0.5 !== 0) {
      errors.push(`Entry ${index + 1}: Tonnage hours must be in 0.5 increments`)
    }

    if (entry.dayLabourHours % 0.5 !== 0) {
      errors.push(`Entry ${index + 1}: Day labour hours must be in 0.5 increments`)
    }
  })

  return errors
}

/**
 * Format date for display
 */
export function formatDocketDate(date: Date): string {
  return date.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * Generate docket reference number
 */
export function generateDocketReference(docket: DocketWithRelations): string {
  const date = formatDocketDate(docket.date).replace(/\//g, '')
  return `${docket.builder.companyCode}-${date}-${docket.id.slice(-4).toUpperCase()}`
}