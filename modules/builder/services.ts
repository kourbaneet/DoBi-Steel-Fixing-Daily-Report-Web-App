import { PRISMA } from "@/libs/prisma"
import { BUILDER_CONSTANTS } from './constants'
import { 
  formatBuilderList, 
  sanitizeBuilderDetail, 
  buildBuilderSearchQuery, 
  buildBuilderFilters,
  formatBuilderLocationList,
  buildLocationSearchQuery
} from './helpers'
import { 
  CreateBuilderInput,
  UpdateBuilderInput,
  GetBuildersInput,
  CreateBuilderLocationInput,
  UpdateBuilderLocationInput
} from './types'

export class BuilderService {
  /**
   * Get list of builders with filtering and pagination
   */
  static async getBuilders(params: GetBuildersInput) {
    const { 
      page, 
      limit, 
      search, 
      sortBy, 
      sortOrder 
    } = params

    const skip = (page - 1) * limit
    
    let where: any = {}

    // Apply search filter
    if (search) {
      where = { ...where, ...buildBuilderSearchQuery(search) }
    }

    // Apply other filters
    const filters = buildBuilderFilters({})
    where = { ...where, ...filters }

    const [builders, totalCount] = await Promise.all([
      PRISMA.builder.findMany({
        where,
        include: {
          _count: {
            select: { locations: true }
          }
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      PRISMA.builder.count({ where })
    ])

    return {
      builders: formatBuilderList(builders),
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    }
  }

  /**
   * Get builder by ID with locations
   */
  static async getBuilderById(builderId: string) {
    const builder = await PRISMA.builder.findUnique({
      where: { id: builderId },
      include: {
        locations: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!builder) {
      throw new Error(BUILDER_CONSTANTS.ERRORS.BUILDER_NOT_FOUND)
    }

    return sanitizeBuilderDetail(builder)
  }

  /**
   * Create a new builder
   */
  static async createBuilder(data: CreateBuilderInput) {
    // Check if company code already exists
    const existingBuilder = await PRISMA.builder.findUnique({
      where: { companyCode: data.companyCode }
    })

    if (existingBuilder) {
      throw new Error(BUILDER_CONSTANTS.ERRORS.COMPANY_CODE_EXISTS)
    }

    const builder = await PRISMA.builder.create({
      data: {
        name: data.name,
        companyCode: data.companyCode,
        abn: data.abn,
        phone: data.phone,
        address: data.address,
        website: data.website,
        supervisorRate: data.supervisorRate,
        tieHandRate: data.tieHandRate,
        tonnageRate: data.tonnageRate,
        contactPerson: data.contactPerson,
        contactEmail: data.contactEmail,
      },
      include: {
        locations: true
      }
    })

    return sanitizeBuilderDetail(builder)
  }

  /**
   * Update builder
   */
  static async updateBuilder(data: UpdateBuilderInput) {
    const { builderId, ...updateData } = data

    // Check if builder exists
    const existingBuilder = await PRISMA.builder.findUnique({
      where: { id: builderId }
    })

    if (!existingBuilder) {
      throw new Error(BUILDER_CONSTANTS.ERRORS.BUILDER_NOT_FOUND)
    }

    // Check if company code already exists (if being updated)
    if (updateData.companyCode && updateData.companyCode !== existingBuilder.companyCode) {
      const builderWithCode = await PRISMA.builder.findUnique({
        where: { companyCode: updateData.companyCode }
      })

      if (builderWithCode) {
        throw new Error(BUILDER_CONSTANTS.ERRORS.COMPANY_CODE_EXISTS)
      }
    }

    const builder = await PRISMA.builder.update({
      where: { id: builderId },
      data: {
        name: updateData.name,
        companyCode: updateData.companyCode,
        abn: updateData.abn,
        phone: updateData.phone,
        address: updateData.address,
        website: updateData.website,
        supervisorRate: updateData.supervisorRate,
        tieHandRate: updateData.tieHandRate,
        tonnageRate: updateData.tonnageRate,
        contactPerson: updateData.contactPerson,
        contactEmail: updateData.contactEmail,
      },
      include: {
        locations: true
      }
    })

    return sanitizeBuilderDetail(builder)
  }

  /**
   * Delete builder
   */
  static async deleteBuilder(builderId: string) {
    // Check if builder exists
    const existingBuilder = await PRISMA.builder.findUnique({
      where: { id: builderId }
    })

    if (!existingBuilder) {
      throw new Error(BUILDER_CONSTANTS.ERRORS.BUILDER_NOT_FOUND)
    }

    // Delete builder (locations will be cascade deleted)
    await PRISMA.builder.delete({
      where: { id: builderId }
    })

    return { success: true, message: BUILDER_CONSTANTS.SUCCESS.BUILDER_DELETED }
  }

  /**
   * Get builder locations with pagination
   */
  static async getBuilderLocations(builderId: string, params: { page?: number, limit?: number, search?: string } = {}) {
    const { 
      page = 1, 
      limit = 20,
      search 
    } = params

    // Check if builder exists
    const builder = await PRISMA.builder.findUnique({
      where: { id: builderId }
    })

    if (!builder) {
      throw new Error(BUILDER_CONSTANTS.ERRORS.BUILDER_NOT_FOUND)
    }

    const skip = (page - 1) * limit
    let where: any = { builderId }

    // Apply search filter
    if (search) {
      where = { ...where, ...buildLocationSearchQuery(search) }
    }

    const [locations, totalCount] = await Promise.all([
      PRISMA.builderLocation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      PRISMA.builderLocation.count({ where })
    ])

    return {
      locations: formatBuilderLocationList(locations),
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    }
  }

  /**
   * Create builder location
   */
  static async createBuilderLocation(data: CreateBuilderLocationInput) {
    const { builderId, label, address } = data

    // Check if builder exists
    const builder = await PRISMA.builder.findUnique({
      where: { id: builderId }
    })

    if (!builder) {
      throw new Error(BUILDER_CONSTANTS.ERRORS.BUILDER_NOT_FOUND)
    }

    // Check if label already exists for this builder
    const existingLocation = await PRISMA.builderLocation.findUnique({
      where: {
        builderId_label: {
          builderId,
          label
        }
      }
    })

    if (existingLocation) {
      throw new Error(BUILDER_CONSTANTS.ERRORS.LOCATION_LABEL_EXISTS)
    }

    const location = await PRISMA.builderLocation.create({
      data: {
        builderId,
        label,
        address,
      }
    })

    return location
  }

  /**
   * Update builder location
   */
  static async updateBuilderLocation(data: UpdateBuilderLocationInput) {
    const { builderId, locationId, label, address } = data

    // Check if location exists and belongs to builder
    const existingLocation = await PRISMA.builderLocation.findUnique({
      where: { id: locationId }
    })

    if (!existingLocation || existingLocation.builderId !== builderId) {
      throw new Error(BUILDER_CONSTANTS.ERRORS.LOCATION_NOT_FOUND)
    }

    // Check if new label already exists for this builder (if being updated)
    if (label !== existingLocation.label) {
      const locationWithLabel = await PRISMA.builderLocation.findUnique({
        where: {
          builderId_label: {
            builderId,
            label
          }
        }
      })

      if (locationWithLabel) {
        throw new Error(BUILDER_CONSTANTS.ERRORS.LOCATION_LABEL_EXISTS)
      }
    }

    const location = await PRISMA.builderLocation.update({
      where: { id: locationId },
      data: {
        label,
        address,
      }
    })

    return location
  }

  /**
   * Delete builder location
   */
  static async deleteBuilderLocation(builderId: string, locationId: string) {
    // Check if location exists and belongs to builder
    const existingLocation = await PRISMA.builderLocation.findUnique({
      where: { id: locationId }
    })

    if (!existingLocation || existingLocation.builderId !== builderId) {
      throw new Error(BUILDER_CONSTANTS.ERRORS.LOCATION_NOT_FOUND)
    }

    await PRISMA.builderLocation.delete({
      where: { id: locationId }
    })

    return { success: true, message: BUILDER_CONSTANTS.SUCCESS.LOCATION_DELETED }
  }
}