import { PRISMA } from "@/libs/prisma"
import { Role, WorkerInvoiceStatus } from "@prisma/client"
import { startOfIsoWeekUTC, endOfIsoWeekUTC, parseWeekString, getWeekLabel } from '@/modules/worker/helpers'
import { sendEmailWithPDF, EmailResult } from "@/libs/resend"
import { PDFGenerator } from "@/libs/pdf-generator"
import { FileStorage } from "@/libs/file-storage"
import { INVOICE_CONSTANTS } from './constants'
import {
  CreateInvoiceInput,
  CreateInvoiceResponse,
  InvoiceData,
  InvoiceEntry,
  GetInvoicesInput,
  GetInvoicesResponse,
  AdminInvoiceListItem,
  UpdateInvoiceInput,
  UpdateInvoiceStatusInput,
  ExportInvoicesInput
} from './types'
import {
  generateInvoiceEmailSubject,
  generateInvoiceEmailBody,
  formatInvoiceDate
} from './helpers'
import { calculateWeekTotals } from '@/modules/worker/helpers'

export class InvoiceService {
  /**
   * Create invoice for worker's timesheet and send email to director
   */
  static async createInvoice(data: CreateInvoiceInput, user: any): Promise<CreateInvoiceResponse> {
    if (!user) {
      throw new Error(INVOICE_CONSTANTS.ERRORS.UNAUTHORIZED)
    }

    // Only WORKER role can create invoices
    if (user.role !== Role.WORKER) {
      throw new Error(INVOICE_CONSTANTS.ERRORS.FORBIDDEN)
    }

    // Get contractor profile - try by userId first, then by email
    let contractor = await PRISMA.contractor.findUnique({
      where: { userId: user.id },
    })

    // If not found by userId, try to find by email and link it
    if (!contractor && user.email) {
      contractor = await PRISMA.contractor.findUnique({
        where: { email: user.email },
      })

      // If found by email, link it to the user
      if (contractor && !contractor.userId) {
        contractor = await PRISMA.contractor.update({
          where: { id: contractor.id },
          data: { userId: user.id },
        })
      }
    }

    if (!contractor) {
      throw new Error(INVOICE_CONSTANTS.ERRORS.CONTRACTOR_NOT_FOUND)
    }

    try {
      const weekStart = new Date(data.weekStart)

      // Validate date
      if (isNaN(weekStart.getTime())) {
        throw new Error(INVOICE_CONSTANTS.ERRORS.INVALID_WEEK_START)
      }

      // Calculate week boundaries using UTC to match worker service
      const weekStartMonday = startOfIsoWeekUTC(weekStart)
      const weekEnd = endOfIsoWeekUTC(weekStartMonday)

      // Check if invoice already exists
      const existingInvoice = await PRISMA.workerInvoice.findUnique({
        where: {
          contractorId_weekStart: {
            contractorId: contractor.id,
            weekStart: weekStartMonday,
          }
        }
      })

      if (existingInvoice) {
        throw new Error(INVOICE_CONSTANTS.ERRORS.INVOICE_ALREADY_EXISTS)
      }

      // Get timesheet entries for this week
      const entries = await PRISMA.docketEntry.findMany({
        where: {
          contractorId: contractor.id,
          docket: {
            date: {
              gte: weekStartMonday,
              lt: new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000) // Add 1 day to include Sunday
            }
          }
        },
        include: {
          docket: {
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
              }
            }
          }
        },
        orderBy: {
          docket: {
            date: 'asc'
          }
        }
      })

      if (entries.length === 0) {
        throw new Error(INVOICE_CONSTANTS.ERRORS.NO_TIMESHEET_DATA)
      }

      // Calculate totals
      const { totalHours } = calculateWeekTotals(entries)
      const hourlyRate = Number(contractor.hourlyRate)
      const totalAmount = totalHours * hourlyRate

      // Create invoice in database
      const invoice = await PRISMA.workerInvoice.create({
        data: {
          contractorId: contractor.id,
          weekStart: weekStartMonday,
          weekEnd: weekEnd,
          totalHours: totalHours,
          hourlyRate: hourlyRate,
          totalAmount: totalAmount,
          status: WorkerInvoiceStatus.SUBMITTED,
          submittedAt: new Date(),
        }
      })

      // Prepare invoice data for email
      const invoiceEntries: InvoiceEntry[] = entries.map(entry => {
        const tonnageHours = Number(entry.tonnageHours) || 0
        const dayLabourHours = Number(entry.dayLabourHours) || 0

        return {
          date: formatInvoiceDate(entry.docket.date),
          builderName: entry.docket.builder.name,
          companyCode: entry.docket.builder.companyCode,
          locationLabel: entry.docket.location.label,
          tonnageHours,
          dayLabourHours,
          totalHours: tonnageHours + dayLabourHours,
        }
      })

      const weekLabel = `${formatInvoiceDate(weekStartMonday)} - ${formatInvoiceDate(weekEnd)}`

      const invoiceData: InvoiceData = {
        invoiceId: invoice.id,
        contractorName: contractor.fullName || contractor.nickname,
        contractorEmail: contractor.email || undefined,
        weekStart: weekStartMonday.toISOString(),
        weekEnd: weekEnd.toISOString(),
        weekLabel,
        hourlyRate,
        totalHours,
        totalAmount,
        entries: invoiceEntries,
        submittedAt: formatInvoiceDate(invoice.submittedAt!),
      }

      // Generate PDF
      let pdfUrl: string | undefined
      let pdfBuffer: Buffer | undefined

      try {
        console.log('📄 Generating PDF for invoice:', invoice.id)
        pdfBuffer = await PDFGenerator.generateInvoicePDF({ invoiceData })

        // Save PDF to file system
        const pdfFilename = FileStorage.generatePDFFilename(invoice.id, invoiceData.contractorName)
        pdfUrl = await FileStorage.savePDF(pdfBuffer, pdfFilename)

        console.log('✅ PDF generated and saved:', pdfUrl)

        // Update invoice with PDF URL
        await PRISMA.workerInvoice.update({
          where: { id: invoice.id },
          data: { pdfUrl }
        })

      } catch (pdfError) {
        console.error('❌ PDF generation failed:', pdfError)
        // Continue without PDF - don't fail the entire process
        pdfBuffer = undefined
      }

      // Generate email content
      const subject = generateInvoiceEmailSubject(invoiceData.contractorName, weekLabel)
      const { text, html } = generateInvoiceEmailBody(invoiceData)

      // Send email to director with PDF attachment
      let emailResult: EmailResult

      try {
        console.log('📧 Sending invoice email with PDF attachment...')

        if (pdfBuffer) {
          // Send email with PDF attachment
          const pdfFilename = `Invoice_${invoice.id}_${invoiceData.contractorName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`

          emailResult = await sendEmailWithPDF(
            {
              to: INVOICE_CONSTANTS.EMAIL.DIRECTOR_EMAIL,
              subject,
              text,
              html,
              replyTo: contractor.email ? [contractor.email] : undefined,
            },
            pdfBuffer,
            pdfFilename
          )
        } else {
          // Send email without attachment if PDF failed
          emailResult = await sendEmailWithPDF(
            {
              to: INVOICE_CONSTANTS.EMAIL.DIRECTOR_EMAIL,
              subject,
              text: text + '\n\n(Note: PDF attachment could not be generated)',
              html: html + '<p><em>Note: PDF attachment could not be generated</em></p>',
              replyTo: contractor.email ? [contractor.email] : undefined,
            },
            Buffer.from(''), // Empty buffer
            'no-attachment.txt'
          )
        }

        if (!emailResult.success) {
          // throw new Error(emailResult.error || 'Email sending failed')
        }

        console.log('✅ Invoice email sent successfully:', emailResult.messageId)

      } catch (emailError) {
        console.error('❌ Failed to send invoice email:', emailError)

        // Update invoice status to indicate email failed
        await PRISMA.workerInvoice.update({
          where: { id: invoice.id },
          data: {
            status: WorkerInvoiceStatus.DRAFT, // Rollback to draft if email fails
            // Keep the PDF URL even if email fails - admin can resend later
          }
        })

        throw new Error(INVOICE_CONSTANTS.ERRORS.EMAIL_SEND_FAILED)
      }

      return {
        success: true,
        invoiceId: invoice.id,
        message: INVOICE_CONSTANTS.SUCCESS.INVOICE_CREATED,
      }

    } catch (error) {
      console.error('Invoice creation error:', error)

      if (error instanceof Error) {
        if (error.message.includes(INVOICE_CONSTANTS.ERRORS.UNAUTHORIZED) ||
            error.message.includes(INVOICE_CONSTANTS.ERRORS.FORBIDDEN) ||
            error.message.includes(INVOICE_CONSTANTS.ERRORS.CONTRACTOR_NOT_FOUND) ||
            error.message.includes(INVOICE_CONSTANTS.ERRORS.INVALID_WEEK_START) ||
            error.message.includes(INVOICE_CONSTANTS.ERRORS.NO_TIMESHEET_DATA) ||
            error.message.includes(INVOICE_CONSTANTS.ERRORS.INVOICE_ALREADY_EXISTS) ||
            error.message.includes(INVOICE_CONSTANTS.ERRORS.EMAIL_SEND_FAILED)) {
          throw error
        }
      }

      throw new Error(INVOICE_CONSTANTS.ERRORS.SERVER_ERROR)
    }
  }

  /**
   * Get invoices for admin with search and filtering
   */
  static async getInvoices(params: GetInvoicesInput, user: any): Promise<GetInvoicesResponse> {
    if (!user) {
      throw new Error(INVOICE_CONSTANTS.ERRORS.UNAUTHORIZED)
    }

    // Only ADMIN role can access this endpoint
    if (user.role !== Role.ADMIN) {
      throw new Error(INVOICE_CONSTANTS.ERRORS.FORBIDDEN)
    }

    const { week, q, page = 1, limit = 20 } = params

    try {
      let weekStart: Date | undefined
      let weekEnd: Date | undefined

      // Parse week if provided
      if (week) {
        const weekDates = parseWeekString(week)
        weekStart = weekDates.weekStart
        weekEnd = weekDates.weekEnd
      }

      // Build where clause
      const where: any = {}

      if (weekStart && weekEnd) {
        where.weekStart = {
          gte: weekStart,
          lt: new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000) // Include full end day
        }
      }

      if (q) {
        where.contractor = {
          OR: [
            { nickname: { contains: q, mode: 'insensitive' } },
            { fullName: { contains: q, mode: 'insensitive' } }
          ]
        }
      }

      // Get total count
      const totalCount = await PRISMA.workerInvoice.count({ where })

      // Get invoices with pagination
      const invoices = await PRISMA.workerInvoice.findMany({
        where,
        include: {
          contractor: {
            select: {
              nickname: true,
              fullName: true
            }
          }
        },
        orderBy: [
          { weekStart: 'desc' },
          { contractor: { nickname: 'asc' } }
        ],
        skip: (page - 1) * limit,
        take: limit
      })

      const totalPages = Math.ceil(totalCount / limit)

      const adminInvoices: AdminInvoiceListItem[] = invoices.map(invoice => {
        const weekLabel = getWeekLabel(invoice.weekStart, invoice.weekEnd)

        return {
          id: invoice.id,
          contractorId: invoice.contractorId,
          contractorNickname: invoice.contractor.nickname,
          contractorFullName: invoice.contractor.fullName || undefined,
          weekStart: invoice.weekStart.toISOString(),
          weekEnd: invoice.weekEnd.toISOString(),
          weekLabel,
          totalHours: Number(invoice.totalHours),
          hourlyRate: Number(invoice.hourlyRate),
          totalAmount: Number(invoice.totalAmount),
          status: invoice.status,
          submittedAt: invoice.submittedAt?.toISOString() || '',
          updatedAt: invoice.updatedAt.toISOString(),
          auditNotes: invoice.auditNotes || undefined
        }
      })

      return {
        invoices: adminInvoices,
        page,
        limit,
        totalCount,
        totalPages
      }

    } catch (error) {
      console.error('Get invoices error:', error)
      throw new Error(INVOICE_CONSTANTS.ERRORS.SERVER_ERROR)
    }
  }

  /**
   * Update invoice details for admin
   */
  static async updateInvoice(invoiceId: string, data: UpdateInvoiceInput, user: any): Promise<{ success: boolean; message: string }> {
    if (!user) {
      throw new Error(INVOICE_CONSTANTS.ERRORS.UNAUTHORIZED)
    }

    // Only ADMIN role can update invoices
    if (user.role !== Role.ADMIN) {
      throw new Error(INVOICE_CONSTANTS.ERRORS.FORBIDDEN)
    }

    try {
      // Check if invoice exists
      const existingInvoice = await PRISMA.workerInvoice.findUnique({
        where: { id: invoiceId }
      })

      if (!existingInvoice) {
        throw new Error(INVOICE_CONSTANTS.ERRORS.INVOICE_NOT_FOUND)
      }

      // Build update data
      const updateData: any = {
        updatedAt: new Date()
      }

      if (data.totalHours !== undefined) {
        updateData.totalHours = data.totalHours
      }

      if (data.hourlyRate !== undefined) {
        updateData.hourlyRate = data.hourlyRate
      }

      if (data.totalAmount !== undefined) {
        updateData.totalAmount = data.totalAmount
      }

      // Add audit note
      if (data.auditNote) {
        const existingNotes = existingInvoice.auditNotes || ''
        const timestamp = new Date().toISOString()
        const newNote = `[${timestamp}] ${user.name || user.email}: ${data.auditNote}`
        updateData.auditNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote
      }

      // Update invoice
      await PRISMA.workerInvoice.update({
        where: { id: invoiceId },
        data: updateData
      })

      return {
        success: true,
        message: INVOICE_CONSTANTS.SUCCESS.INVOICE_UPDATED
      }

    } catch (error) {
      console.error('Update invoice error:', error)

      if (error instanceof Error) {
        if (error.message.includes(INVOICE_CONSTANTS.ERRORS.INVOICE_NOT_FOUND)) {
          throw error
        }
      }

      throw new Error(INVOICE_CONSTANTS.ERRORS.SERVER_ERROR)
    }
  }

  /**
   * Update invoice status
   */
  static async updateInvoiceStatus(invoiceId: string, data: UpdateInvoiceStatusInput, user: any): Promise<{ success: boolean; message: string }> {
    if (!user) {
      throw new Error(INVOICE_CONSTANTS.ERRORS.UNAUTHORIZED)
    }

    // Only ADMIN role can update invoice status
    if (user.role !== Role.ADMIN) {
      throw new Error(INVOICE_CONSTANTS.ERRORS.FORBIDDEN)
    }

    try {
      // Check if invoice exists
      const existingInvoice = await PRISMA.workerInvoice.findUnique({
        where: { id: invoiceId }
      })

      if (!existingInvoice) {
        throw new Error(INVOICE_CONSTANTS.ERRORS.INVOICE_NOT_FOUND)
      }

      // Build update data
      const updateData: any = {
        status: data.status,
        updatedAt: new Date()
      }

      // Set paid date if marking as paid
      if (data.status === 'PAID') {
        updateData.paidAt = new Date()
      }

      // Add audit note
      if (data.auditNote) {
        const existingNotes = existingInvoice.auditNotes || ''
        const timestamp = new Date().toISOString()
        const newNote = `[${timestamp}] ${user.name || user.email}: Status changed to ${data.status}. ${data.auditNote}`
        updateData.auditNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote
      } else {
        const existingNotes = existingInvoice.auditNotes || ''
        const timestamp = new Date().toISOString()
        const newNote = `[${timestamp}] ${user.name || user.email}: Status changed to ${data.status}`
        updateData.auditNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote
      }

      // Update invoice
      await PRISMA.workerInvoice.update({
        where: { id: invoiceId },
        data: updateData
      })

      return {
        success: true,
        message: INVOICE_CONSTANTS.SUCCESS.INVOICE_STATUS_UPDATED
      }

    } catch (error) {
      console.error('Update invoice status error:', error)

      if (error instanceof Error) {
        if (error.message.includes(INVOICE_CONSTANTS.ERRORS.INVOICE_NOT_FOUND)) {
          throw error
        }
      }

      throw new Error(INVOICE_CONSTANTS.ERRORS.SERVER_ERROR)
    }
  }
}