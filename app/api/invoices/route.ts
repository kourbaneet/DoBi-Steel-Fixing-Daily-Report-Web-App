import { requireAuth, requireRole } from "@/lib/middleware/auth"
import { validateBody } from "@/lib/middleware/validation"
import { createMethodRoute } from "@/lib/middleware/compose"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { InvoiceService } from "@/modules/invoice/services"
import { createInvoiceSchema } from "@/modules/invoice/validations"
import { INVOICE_CONSTANTS } from "@/modules/invoice/constants"

// GET handler - List invoices for admin with search and filtering
const getInvoicesHandler = async (req: ApiRequest) => {
  try {
    const { searchParams } = new URL(req.url)

    const params = {
      week: searchParams.get("week") || undefined,
      q: searchParams.get("q") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    }

    const result = await InvoiceService.getInvoices(params, req.user)

    return ApiResponseUtil.success(
      'Invoices retrieved successfully',
      result.invoices,
      200,
      {
        page: result.page,
        limit: result.limit,
        total: result.totalCount,
        totalPages: result.totalPages
      }
    )
  } catch (error) {
    console.error("Error fetching invoices:", error)

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

// POST handler - Create invoice and email director
const createInvoiceHandler = async (req: ApiRequest) => {
  try {
    const result = await InvoiceService.createInvoice(req.validatedBody, req.user)

    return ApiResponseUtil.created(
      INVOICE_CONSTANTS.SUCCESS.INVOICE_CREATED,
      result
    )
  } catch (error) {
    console.error("Error creating invoice:", error)

    if (error instanceof Error) {
      if (error.message === INVOICE_CONSTANTS.ERRORS.UNAUTHORIZED) {
        return ApiResponseUtil.unauthorized(error.message)
      }
      if (error.message === INVOICE_CONSTANTS.ERRORS.FORBIDDEN) {
        return ApiResponseUtil.forbidden(error.message)
      }
      if (error.message === INVOICE_CONSTANTS.ERRORS.CONTRACTOR_NOT_FOUND) {
        return ApiResponseUtil.notFound(error.message)
      }
      if (error.message === INVOICE_CONSTANTS.ERRORS.INVALID_WEEK_START ||
          error.message === INVOICE_CONSTANTS.ERRORS.NO_TIMESHEET_DATA ||
          error.message === INVOICE_CONSTANTS.ERRORS.INVOICE_ALREADY_EXISTS) {
        return ApiResponseUtil.badRequest(error.message)
      }
      if (error.message === INVOICE_CONSTANTS.ERRORS.EMAIL_SEND_FAILED) {
        return ApiResponseUtil.serverError(error.message)
      }
    }

    return ApiResponseUtil.serverError(INVOICE_CONSTANTS.ERRORS.SERVER_ERROR)
  }
}

// Create routes with middleware
export const GET = createMethodRoute(
  'GET',
  [
    requireAuth(),
    requireRole(['ADMIN'])
  ],
  getInvoicesHandler
).GET

export const POST = createMethodRoute(
  'POST',
  [
    requireAuth(),
    requireRole(['WORKER']),
    validateBody(createInvoiceSchema)
  ],
  createInvoiceHandler
).POST