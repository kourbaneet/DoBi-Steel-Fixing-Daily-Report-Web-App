import { NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/middleware/auth"
import { createMethodRoute } from "@/lib/middleware/compose"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { InvoiceService } from "@/modules/invoice/services"
import { INVOICE_CONSTANTS } from "@/modules/invoice/constants"

// GET handler - Export invoices as CSV/XLSX
const exportInvoicesHandler = async (req: ApiRequest) => {
  try {
    const { searchParams } = new URL(req.url)

    const week = searchParams.get("week")
    const format = searchParams.get("format") || "csv"

    if (!week) {
      return ApiResponseUtil.badRequest("Week parameter is required")
    }

    const params = { week, format: format as 'csv' | 'xlsx' }

    // Get invoices data
    const result = await InvoiceService.getInvoices({ week }, req.user)

    if (format === 'csv') {
      // Generate CSV content
      const csvHeader = "Nickname,Full Name,Week,Total Hours,Hourly Rate,Total Amount,Status,Submitted At\n"
      const csvRows = result.invoices.map(invoice => {
        return [
          `"${invoice.contractorNickname}"`,
          `"${invoice.contractorFullName || ''}"`,
          `"${invoice.weekLabel}"`,
          invoice.totalHours,
          invoice.hourlyRate,
          invoice.totalAmount,
          `"${invoice.status}"`,
          `"${invoice.submittedAt ? new Date(invoice.submittedAt).toLocaleDateString() : ''}"`
        ].join(',')
      }).join('\n')

      const csvContent = csvHeader + csvRows

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="invoices-${week}.csv"`
        }
      })
    }

    // For now, return CSV for XLSX too (can be enhanced later with proper XLSX library)
    return ApiResponseUtil.badRequest("XLSX format not yet implemented")

  } catch (error) {
    console.error("Error exporting invoices:", error)

    if (error instanceof Error) {
      if (error.message === INVOICE_CONSTANTS.ERRORS.UNAUTHORIZED) {
        return ApiResponseUtil.unauthorized(error.message)
      }
      if (error.message === INVOICE_CONSTANTS.ERRORS.FORBIDDEN) {
        return ApiResponseUtil.forbidden(error.message)
      }
    }

    return ApiResponseUtil.serverError(INVOICE_CONSTANTS.ERRORS.SERVER_ERROR)
  }
}

// Create route with middleware
export const GET = createMethodRoute(
  'GET',
  [
    requireAuth(),
    requireRole(['ADMIN'])
  ],
  exportInvoicesHandler
).GET