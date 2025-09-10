import { PRISMA } from "@/libs/prisma"
import { Role } from "@prisma/client"
import { Session } from "next-auth"
import { DOCKET_CONSTANTS } from './constants'
import { 
  formatDocketList, 
  sanitizeDocketDetail, 
  buildDocketSearchQuery, 
  buildDocketFilters,
  buildAuthorizationFilter,
  getDocketPermissions,
  validateDocketEntries
} from './helpers'
import { 
  CreateDocketInput,
  UpdateDocketInput,
  GetDocketsInput,
  DocketWithRelations,
  GetDocketsResponse,
  CreateDocketResponse,
  UpdateDocketResponse,
  GetDocketResponse
} from './types'

export class DocketService {
  /**
   * Get list of dockets with filtering, pagination and authorization
   */
  static async getDockets(params: GetDocketsInput, user: any): Promise<GetDocketsResponse> {
    const { 
      page, 
      limit, 
      builderId,
      locationId,
      supervisorId,
      startDate,
      endDate,
      sortBy, 
      sortOrder 
    } = params

    const skip = (page - 1) * limit
    
    let where: any = {}

    // Apply authorization filter first
    const authFilter = buildAuthorizationFilter({ user })
    where = { ...where, ...authFilter }

    // Apply additional filters
    const filters = buildDocketFilters({
      builderId,
      locationId,
      supervisorId,
      startDate,
      endDate
    })
    where = { ...where, ...filters }

    const [dockets, totalCount] = await Promise.all([
      PRISMA.docket.findMany({
        where,
        include: {
          builder: {
            select: {
              id: true,
              name: true,
              companyCode: true,
            }
          },
          location: {
            select: {
              id: true,
              label: true,
            }
          },
          supervisor: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          _count: {
            select: {
              entries: true,
              media: true,
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      PRISMA.docket.count({ where }),
    ])

    const totalPages = Math.ceil(totalCount / limit)
    const formattedDockets = formatDocketList(dockets)

    return {
      dockets: formattedDockets,
      page,
      limit,
      totalCount,
      totalPages,
    }
  }

  /**
   * Get single docket by ID with authorization check
   */
  static async getDocketById(docketId: string, user: any): Promise<GetDocketResponse> {
    // First check if docket exists and user has access
    const authFilter = buildAuthorizationFilter({ user })
    
    const docket = await PRISMA.docket.findFirst({
      where: {
        id: docketId,
        ...authFilter
      },
      include: {
        builder: true,
        location: true,
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        },
        entries: {
          include: {
            contractor: {
              select: {
                id: true,
                nickname: true,
                firstName: true,
                lastName: true,
                fullName: true,
                hourlyRate: true,
                position: true,
                active: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        media: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
    })

    if (!docket) {
      throw new Error(DOCKET_CONSTANTS.ERRORS.DOCKET_NOT_FOUND)
    }

    const sanitizedDocket = sanitizeDocketDetail(docket)

    return {
      docket: sanitizedDocket,
    }
  }

  /**
   * Create new docket with validation and authorization
   */
  static async createDocket(data: CreateDocketInput, user: any): Promise<CreateDocketResponse> {
    if (!user) {
      throw new Error(DOCKET_CONSTANTS.ERRORS.UNAUTHORIZED)
    }

    // Check permissions
    const permissions = getDocketPermissions({ user })
    if (!permissions.canCreate) {
      throw new Error(DOCKET_CONSTANTS.ERRORS.FORBIDDEN)
    }

    // Validate entries
    const entryErrors = validateDocketEntries(data.entries)
    if (entryErrors.length > 0) {
      throw new Error(entryErrors.join(', '))
    }

    // Always get supervisorId from the authenticated user
    const supervisorId = user.id

    // Verify related entities exist
    const [builder, location, supervisor, contractors] = await Promise.all([
      PRISMA.builder.findUnique({ where: { id: data.builderId } }),
      PRISMA.builderLocation.findUnique({ where: { id: data.locationId } }),
      PRISMA.user.findUnique({ 
        where: { 
          id: supervisorId,
          role: { in: [Role.ADMIN, Role.SUPERVISOR] }
        } 
      }),
      PRISMA.contractor.findMany({
        where: {
          id: { in: data.entries.map(e => e.contractorId) },
          active: true
        }
      })
    ])

    if (!builder) {
      throw new Error(DOCKET_CONSTANTS.ERRORS.BUILDER_NOT_FOUND)
    }

    if (!location) {
      throw new Error(DOCKET_CONSTANTS.ERRORS.LOCATION_NOT_FOUND)
    }

    if (!supervisor) {
      throw new Error(DOCKET_CONSTANTS.ERRORS.SUPERVISOR_NOT_FOUND)
    }

    const contractorIds = contractors.map(c => c.id)
    const missingContractors = data.entries.filter(e => !contractorIds.includes(e.contractorId))
    if (missingContractors.length > 0) {
      throw new Error(DOCKET_CONSTANTS.ERRORS.CONTRACTOR_NOT_FOUND)
    }

    // Create docket with entries and media in transaction
    const docket = await PRISMA.$transaction(async (tx) => {
      const createdDocket = await tx.docket.create({
        data: {
          date: data.date,
          builderId: data.builderId,
          locationId: data.locationId,
          supervisorId: supervisorId,
          scheduleNo: data.scheduleNo,
          description: data.description,
          siteManagerName: data.siteManagerName,
          siteManagerSignatureUrl: data.siteManagerSignatureUrl,
          entries: {
            create: data.entries.map(entry => ({
              contractorId: entry.contractorId,
              tonnageHours: entry.tonnageHours,
              dayLabourHours: entry.dayLabourHours,
            }))
          },
          media: data.media && data.media.length > 0 ? {
            create: data.media.map(media => ({
              type: media.type,
              url: media.url,
              caption: media.caption,
            }))
          } : undefined
        },
        include: {
          builder: true,
          location: true,
          supervisor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            }
          },
          entries: {
            include: {
              contractor: {
                select: {
                  id: true,
                  nickname: true,
                  firstName: true,
                  lastName: true,
                  fullName: true,
                  hourlyRate: true,
                  position: true,
                  active: true,
                }
              }
            }
          },
          media: true
        }
      })

      return createdDocket
    })

    const sanitizedDocket = sanitizeDocketDetail(docket)

    return {
      docket: sanitizedDocket,
    }
  }

  /**
   * Update existing docket with validation and authorization
   */
  static async updateDocket(data: UpdateDocketInput, user: any): Promise<UpdateDocketResponse> {
    if (!user) {
      throw new Error(DOCKET_CONSTANTS.ERRORS.UNAUTHORIZED)
    }

    // Get existing docket first
    const existingDocket = await PRISMA.docket.findUnique({
      where: { id: data.docketId },
      include: {
        builder: true,
        location: true,
        supervisor: true,
        entries: true,
        media: true,
      }
    })

    if (!existingDocket) {
      throw new Error(DOCKET_CONSTANTS.ERRORS.DOCKET_NOT_FOUND)
    }

    // Check permissions
    const permissions = getDocketPermissions({ user }, existingDocket as DocketWithRelations)
    if (!permissions.canUpdate) {
      throw new Error(DOCKET_CONSTANTS.ERRORS.FORBIDDEN)
    }

    // Validate entries if provided
    if (data.entries) {
      const entryErrors = validateDocketEntries(data.entries)
      if (entryErrors.length > 0) {
        throw new Error(entryErrors.join(', '))
      }
    }

    // Always use the authenticated user as supervisor (no changes allowed)
    const supervisorId = user.id

    // Verify related entities exist if they're being updated
    const validationPromises: Promise<any>[] = []

    if (data.builderId) {
      validationPromises.push(
        PRISMA.builder.findUnique({ where: { id: data.builderId } })
          .then(builder => {
            if (!builder) throw new Error(DOCKET_CONSTANTS.ERRORS.BUILDER_NOT_FOUND)
          })
      )
    }

    if (data.locationId) {
      validationPromises.push(
        PRISMA.builderLocation.findUnique({ where: { id: data.locationId } })
          .then(location => {
            if (!location) throw new Error(DOCKET_CONSTANTS.ERRORS.LOCATION_NOT_FOUND)
          })
      )
    }

    if (supervisorId && supervisorId !== existingDocket.supervisorId) {
      validationPromises.push(
        PRISMA.user.findUnique({ 
          where: { 
            id: supervisorId,
            role: { in: [Role.ADMIN, Role.SUPERVISOR] }
          } 
        }).then(supervisor => {
          if (!supervisor) throw new Error(DOCKET_CONSTANTS.ERRORS.SUPERVISOR_NOT_FOUND)
        })
      )
    }

    if (data.entries && data.entries.length > 0) {
      validationPromises.push(
        PRISMA.contractor.findMany({
          where: {
            id: { in: data.entries.map(e => e.contractorId) },
            active: true
          }
        }).then(contractors => {
          const contractorIds = contractors.map(c => c.id)
          const missingContractors = data.entries!.filter(e => !contractorIds.includes(e.contractorId))
          if (missingContractors.length > 0) {
            throw new Error(DOCKET_CONSTANTS.ERRORS.CONTRACTOR_NOT_FOUND)
          }
        })
      )
    }

    await Promise.all(validationPromises)

    // Update docket with entries and media in transaction
    const docket = await PRISMA.$transaction(async (tx) => {
      // Prepare update data
      const updateData: any = {}
      
      if (data.date !== undefined) updateData.date = data.date
      if (data.builderId !== undefined) updateData.builderId = data.builderId
      if (data.locationId !== undefined) updateData.locationId = data.locationId
      if (supervisorId !== undefined) updateData.supervisorId = supervisorId
      if (data.scheduleNo !== undefined) updateData.scheduleNo = data.scheduleNo
      if (data.description !== undefined) updateData.description = data.description
      if (data.siteManagerName !== undefined) updateData.siteManagerName = data.siteManagerName
      if (data.siteManagerSignatureUrl !== undefined) updateData.siteManagerSignatureUrl = data.siteManagerSignatureUrl

      // Update entries if provided
      if (data.entries) {
        // Delete existing entries
        await tx.docketEntry.deleteMany({
          where: { docketId: data.docketId }
        })

        // Create new entries
        updateData.entries = {
          create: data.entries.map(entry => ({
            contractorId: entry.contractorId,
            tonnageHours: entry.tonnageHours,
            dayLabourHours: entry.dayLabourHours,
          }))
        }
      }

      // Update media if provided
      if (data.media) {
        // Delete existing media
        await tx.docketMedia.deleteMany({
          where: { docketId: data.docketId }
        })

        // Create new media
        if (data.media.length > 0) {
          updateData.media = {
            create: data.media.map(media => ({
              type: media.type,
              url: media.url,
              caption: media.caption,
            }))
          }
        }
      }

      const updatedDocket = await tx.docket.update({
        where: { id: data.docketId },
        data: updateData,
        include: {
          builder: true,
          location: true,
          supervisor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            }
          },
          entries: {
            include: {
              contractor: {
                select: {
                  id: true,
                  nickname: true,
                  firstName: true,
                  lastName: true,
                  fullName: true,
                  hourlyRate: true,
                  position: true,
                  active: true,
                }
              }
            }
          },
          media: true
        }
      })

      return updatedDocket
    })

    const sanitizedDocket = sanitizeDocketDetail(docket)

    return {
      docket: sanitizedDocket,
    }
  }

  /**
   * Delete docket with authorization check
   */
  static async deleteDocket(docketId: string, user: any): Promise<void> {
    if (!user) {
      throw new Error(DOCKET_CONSTANTS.ERRORS.UNAUTHORIZED)
    }

    // Get existing docket first
    const existingDocket = await PRISMA.docket.findUnique({
      where: { id: docketId },
      include: {
        builder: true,
        location: true,
        supervisor: true,
        entries: true,
        media: true,
      }
    })

    if (!existingDocket) {
      throw new Error(DOCKET_CONSTANTS.ERRORS.DOCKET_NOT_FOUND)
    }

    // Check permissions
    const permissions = getDocketPermissions({ user }, existingDocket as DocketWithRelations)
    if (!permissions.canDelete) {
      throw new Error(DOCKET_CONSTANTS.ERRORS.FORBIDDEN)
    }

    // Delete docket (cascade will handle entries and media)
    await PRISMA.docket.delete({
      where: { id: docketId }
    })
  }
}