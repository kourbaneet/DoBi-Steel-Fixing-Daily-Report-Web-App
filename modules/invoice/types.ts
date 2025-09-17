export interface CreateInvoiceInput {
  weekStart: string
}

export interface CreateInvoiceResponse {
  success: boolean
  invoiceId: string
  message: string
}

export interface InvoiceData {
  invoiceId: string
  contractorName: string
  contractorEmail?: string
  weekStart: string
  weekEnd: string
  weekLabel: string
  hourlyRate: number
  totalHours: number
  totalAmount: number
  entries: InvoiceEntry[]
  submittedAt: string
}

export interface InvoiceEntry {
  date: string
  builderName: string
  companyCode: string
  locationLabel: string
  tonnageHours: number
  dayLabourHours: number
  totalHours: number
}

// Admin types
export interface AdminInvoiceListItem {
  id: string
  contractorId: string
  contractorNickname: string
  contractorFullName?: string
  weekStart: string
  weekEnd: string
  weekLabel: string
  totalHours: number
  hourlyRate: number
  totalAmount: number
  status: string
  submittedAt: string
  updatedAt: string
  auditNotes?: string
}

export interface GetInvoicesInput {
  week?: string
  q?: string
  page?: number
  limit?: number
}

export interface GetInvoicesResponse {
  invoices: AdminInvoiceListItem[]
  page: number
  limit: number
  totalCount: number
  totalPages: number
}

export interface UpdateInvoiceInput {
  totalHours?: number
  hourlyRate?: number
  totalAmount?: number
  auditNote?: string
}

export interface UpdateInvoiceStatusInput {
  status: 'DRAFT' | 'SUBMITTED' | 'PAID'
  auditNote?: string
}

export interface ExportInvoicesInput {
  week: string
  format?: 'csv' | 'xlsx'
}