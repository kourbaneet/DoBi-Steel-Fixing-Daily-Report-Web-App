import { requireAuth, requireRole } from "@/lib/middleware/auth"
import { validateBody } from "@/lib/middleware/validation"
import { createMethodRoute } from "@/lib/middleware/compose"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { InvoiceService } from "@/modules/invoice/services"
import { updateInvoiceStatusSchema } from "@/modules/invoice/validations"
import { INVOICE_CONSTANTS } from "@/modules/invoice/constants"

// PATCH handler - Update invoice status (admin only)
const updateInvoiceStatusHandler = async (req: ApiRequest, { params }: { params: { id: string } }) => {
  try {
    const result = await InvoiceService.updateInvoiceStatus(params.id, req.validatedBody, req.user)

    return ApiResponseUtil.success(
      result.message,
      { success: result.success }
    )
  } catch (error) {
    console.error("Error updating invoice status:", error)

    if (error instanceof Error) {
      if (error.message === INVOICE_CONSTANTS.ERRORS.UNAUTHORIZED) {
        return ApiResponseUtil.unauthorized(error.message)
      }
      if (error.message === INVOICE_CONSTANTS.ERRORS.FORBIDDEN) {
        return ApiResponseUtil.forbidden(error.message)
      }
      if (error.message === INVOICE_CONSTANTS.ERRORS.INVOICE_NOT_FOUND) {
        return ApiResponseUtil.notFound(error.message)
      }
    }

    return ApiResponseUtil.serverError(INVOICE_CONSTANTS.ERRORS.SERVER_ERROR)
  }
}

// Create route with middleware
export const PATCH = createMethodRoute(
  'PATCH',
  [
    requireAuth(),
    requireRole(['ADMIN']),
    validateBody(updateInvoiceStatusSchema)
  ],
  updateInvoiceStatusHandler
).PATCH