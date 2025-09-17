import { PRISMA } from "@/libs/prisma"
import { Role } from "@prisma/client"
import { format } from 'date-fns'
import { HISTORY_CONSTANTS } from './constants'
import {
  GetDocketsHistoryInput,
  GetDocketsHistoryResponse,
  GetPaymentsHistoryInput,
  GetPaymentsHistoryResponse,
  DocketHistoryItem,
  PaymentHistoryItem,
  ExportDocketsInput,
  ExportPaymentsInput
} from './types'

export class HistoryService {
  /**
   * Get dockets history with filters and pagination
   */
  static async getDocketsHistory(params: GetDocketsHistoryInput, user: any): Promise<GetDocketsHistoryResponse> {
    if (!user) {
      throw new Error(HISTORY_CONSTANTS.ERRORS.UNAUTHORIZED)
    }

    // Only ADMIN role can access history
    if (user.role !== Role.ADMIN) {
      throw new Error(HISTORY_CONSTANTS.ERRORS.FORBIDDEN)
    }

    const {
      dateFrom,
      dateTo,
      builderId,
      locationId,
      supervisorId,
      contractorId,
      q,
      page = HISTORY_CONSTANTS.PAGINATION.DEFAULT_PAGE,
      limit = HISTORY_CONSTANTS.PAGINATION.DEFAULT_LIMIT
    } = params

    try {
      // Build where clause
      const where: any = {}

      // Date range filter
      if (dateFrom || dateTo) {
        where.docket = where.docket || {}
        where.docket.date = {}
        if (dateFrom) {
          where.docket.date.gte = new Date(dateFrom)
        }
        if (dateTo) {
          where.docket.date.lte = new Date(dateTo)
        }
      }

      // Builder filter
      if (builderId) {
        where.docket = where.docket || {}
        where.docket.builderId = builderId
      }

      // Location filter
      if (locationId) {
        where.docket = where.docket || {}
        where.docket.locationId = locationId
      }

      // Supervisor filter
      if (supervisorId) {
        where.docket = where.docket || {}
        where.docket.supervisorId = supervisorId
      }

      // Contractor filter
      if (contractorId) {
        where.contractorId = contractorId
      }

      // Search query (contractor nickname, builder name, location)
      if (q) {
        where.OR = [
          {
            contractor: {
              nickname: { contains: q }
            }
          },
          {
            contractor: {
              fullName: { contains: q }
            }
          },
          {
            docket: {
              builder: {
                name: { contains: q }
              }
            }
          },
          {
            docket: {
              location: {
                label: { contains: q }
              }
            }
          }
        ]
      }

      // Get total count for pagination
      const totalCount = await PRISMA.docketEntry.count({ where })

      // Get docket entries with relations
      const entries = await PRISMA.docketEntry.findMany({
        where,
        include: {
          docket: {
            include: {
              builder: {
                select: {
                  id: true,
                  name: true,
                  companyCode: true
                }
              },
              location: {
                select: {
                  id: true,
                  label: true
                }
              },
              supervisor: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          contractor: {
            select: {
              id: true,
              nickname: true,
              fullName: true
            }
          }
        },
        orderBy: [
          { docket: { date: 'desc' } },
          { docket: { createdAt: 'desc' } }
        ],
        skip: (page - 1) * limit,
        take: limit
      })

      const totalPages = Math.ceil(totalCount / limit)

      // Transform to response format
      const dockets: DocketHistoryItem[] = entries.map(entry => ({
        id: entry.id,
        date: format(entry.docket.date, HISTORY_CONSTANTS.FORMATS.DATE_FORMAT),
        builderName: entry.docket.builder.name,
        builderCompanyCode: entry.docket.builder.companyCode,
        locationLabel: entry.docket.location.label,
        supervisorName: entry.docket.supervisor.name || entry.docket.supervisor.email || 'Unknown Supervisor',
        scheduleNo: entry.docket.scheduleNo || undefined,
        description: entry.docket.description || undefined,
        contractorNickname: entry.contractor.nickname,
        contractorFullName: entry.contractor.fullName || undefined,
        tonnageHours: Number(entry.tonnageHours),
        dayLabourHours: Number(entry.dayLabourHours),
        totalHours: Number(entry.tonnageHours) + Number(entry.dayLabourHours),
        createdAt: format(entry.createdAt, HISTORY_CONSTANTS.FORMATS.DATE_FORMAT)
      }))

      // Calculate totals
      const totals = {
        totalHours: dockets.reduce((sum, d) => sum + d.totalHours, 0),
        totalTonnageHours: dockets.reduce((sum, d) => sum + d.tonnageHours, 0),
        totalDayLabourHours: dockets.reduce((sum, d) => sum + d.dayLabourHours, 0),
        totalEntries: dockets.length
      }

      return {
        dockets,
        page,
        limit,
        totalCount,
        totalPages,
        totals
      }

    } catch (error) {
      console.error('Get dockets history error:', error)

      // Log the actual error for debugging
      if (error instanceof Error) {
        console.error('Error details:', error.message)
        console.error('Error stack:', error.stack)
      }

      throw new Error(HISTORY_CONSTANTS.ERRORS.SERVER_ERROR)
    }
  }

  /**
   * Get payments history with filters and pagination
   */
  static async getPaymentsHistory(params: GetPaymentsHistoryInput, user: any): Promise<GetPaymentsHistoryResponse> {
    if (!user) {
      throw new Error(HISTORY_CONSTANTS.ERRORS.UNAUTHORIZED)
    }

    // Only ADMIN role can access history
    if (user.role !== Role.ADMIN) {
      throw new Error(HISTORY_CONSTANTS.ERRORS.FORBIDDEN)
    }

    const {
      dateFrom,
      dateTo,
      contractorId,
      status,
      q,
      page = HISTORY_CONSTANTS.PAGINATION.DEFAULT_PAGE,
      limit = HISTORY_CONSTANTS.PAGINATION.DEFAULT_LIMIT
    } = params

    try {
      // Build where clause
      const where: any = {}

      // Date range filter (using weekStart for payments)
      if (dateFrom || dateTo) {
        where.weekStart = {}
        if (dateFrom) {
          where.weekStart.gte = new Date(dateFrom)
        }
        if (dateTo) {
          where.weekStart.lte = new Date(dateTo)
        }
      }

      // Contractor filter
      if (contractorId) {
        where.contractorId = contractorId
      }

      // Status filter
      if (status) {
        where.status = status
      }

      // Search query (contractor nickname/name)
      if (q) {
        where.OR = [
          {
            contractor: {
              nickname: { contains: q }
            }
          },
          {
            contractor: {
              fullName: { contains: q }
            }
          }
        ]
      }

      // Get total count for pagination
      const totalCount = await PRISMA.workerInvoice.count({ where })

      // Get invoices with contractor data
      const invoices = await PRISMA.workerInvoice.findMany({
        where,
        include: {
          contractor: {
            select: {
              id: true,
              nickname: true,
              fullName: true
            }
          }
        },
        orderBy: [
          { weekStart: 'desc' },
          { submittedAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      })

      const totalPages = Math.ceil(totalCount / limit)

      // Transform to response format
      const payments: PaymentHistoryItem[] = invoices.map(invoice => {
        const weekLabel = `${format(invoice.weekStart, 'MMM dd')} - ${format(invoice.weekEnd, 'MMM dd, yyyy')}`

        return {
          id: invoice.id,
          contractorNickname: invoice.contractor.nickname,
          contractorFullName: invoice.contractor.fullName || undefined,
          weekStart: invoice.weekStart.toISOString(),
          weekEnd: invoice.weekEnd.toISOString(),
          weekLabel,
          totalHours: Number(invoice.totalHours),
          hourlyRate: Number(invoice.hourlyRate),
          totalAmount: Number(invoice.totalAmount),
          status: invoice.status,
          submittedAt: invoice.submittedAt?.toISOString(),
          paidAt: invoice.paidAt?.toISOString(),
          updatedAt: invoice.updatedAt.toISOString()
        }
      })

      // Calculate totals
      const totals = {
        totalAmount: payments.reduce((sum, p) => sum + p.totalAmount, 0),
        totalHours: payments.reduce((sum, p) => sum + p.totalHours, 0),
        totalInvoices: payments.length,
        paidAmount: payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.totalAmount, 0),
        pendingAmount: payments.filter(p => p.status !== 'PAID').reduce((sum, p) => sum + p.totalAmount, 0)
      }

      return {
        payments,
        page,
        limit,
        totalCount,
        totalPages,
        totals
      }

    } catch (error) {
      console.error('Get payments history error:', error)
      throw new Error(HISTORY_CONSTANTS.ERRORS.SERVER_ERROR)
    }
  }

  /**
   * Export dockets history as CSV
   */
  static async exportDocketsHistory(params: ExportDocketsInput, user: any): Promise<string> {
    if (!user) {
      throw new Error(HISTORY_CONSTANTS.ERRORS.UNAUTHORIZED)
    }

    if (user.role !== Role.ADMIN) {
      throw new Error(HISTORY_CONSTANTS.ERRORS.FORBIDDEN)
    }

    try {
      // Get all dockets (no pagination for export)
      const result = await this.getDocketsHistory({
        ...params,
        page: 1,
        limit: HISTORY_CONSTANTS.PAGINATION.MAX_LIMIT
      }, user)

      if (params.format === 'csv') {
        // Generate CSV content
        const csvHeader = "Date,Builder,Company Code,Location,Supervisor,Contractor,Schedule No,Description,Tonnage Hours,Day Labour Hours,Total Hours,Created At\n"
        const csvRows = result.dockets.map(docket => {
          return [
            `"${docket.date}"`,
            `"${docket.builderName}"`,
            `"${docket.builderCompanyCode}"`,
            `"${docket.locationLabel}"`,
            `"${docket.supervisorName}"`,
            `"${docket.contractorNickname}"`,
            `"${docket.scheduleNo || ''}"`,
            `"${docket.description || ''}"`,
            docket.tonnageHours.toFixed(2),
            docket.dayLabourHours.toFixed(2),
            docket.totalHours.toFixed(2),
            `"${docket.createdAt}"`
          ].join(',')
        }).join('\n')

        return csvHeader + csvRows
      }

      throw new Error('XLSX format not yet implemented')

    } catch (error) {
      console.error('Export dockets history error:', error)
      throw new Error(HISTORY_CONSTANTS.ERRORS.EXPORT_FAILED)
    }
  }

  /**
   * Export payments history as CSV
   */
  static async exportPaymentsHistory(params: ExportPaymentsInput, user: any): Promise<string> {
    if (!user) {
      throw new Error(HISTORY_CONSTANTS.ERRORS.UNAUTHORIZED)
    }

    if (user.role !== Role.ADMIN) {
      throw new Error(HISTORY_CONSTANTS.ERRORS.FORBIDDEN)
    }

    try {
      // Get all payments (no pagination for export)
      const result = await this.getPaymentsHistory({
        ...params,
        page: 1,
        limit: HISTORY_CONSTANTS.PAGINATION.MAX_LIMIT
      }, user)

      if (params.format === 'csv') {
        // Generate CSV content
        const csvHeader = "Contractor,Full Name,Week,Total Hours,Hourly Rate,Total Amount,Status,Submitted At,Paid At\n"
        const csvRows = result.payments.map(payment => {
          return [
            `"${payment.contractorNickname}"`,
            `"${payment.contractorFullName || ''}"`,
            `"${payment.weekLabel}"`,
            payment.totalHours.toFixed(2),
            payment.hourlyRate.toFixed(2),
            payment.totalAmount.toFixed(2),
            `"${payment.status}"`,
            `"${payment.submittedAt ? new Date(payment.submittedAt).toLocaleDateString() : ''}"`,
            `"${payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : ''}"`
          ].join(',')
        }).join('\n')

        return csvHeader + csvRows
      }

      throw new Error('XLSX format not yet implemented')

    } catch (error) {
      console.error('Export payments history error:', error)
      throw new Error(HISTORY_CONSTANTS.ERRORS.EXPORT_FAILED)
    }
  }
}