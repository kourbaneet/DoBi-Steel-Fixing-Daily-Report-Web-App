export interface DocketHistoryItem {
  id: string
  date: string
  builderName: string
  builderCompanyCode: string
  locationLabel: string
  supervisorName: string
  scheduleNo?: string
  description?: string
  contractorNickname: string
  contractorFullName?: string
  tonnageHours: number
  dayLabourHours: number
  totalHours: number
  createdAt: string
}

export interface PaymentHistoryItem {
  id: string
  contractorNickname: string
  contractorFullName?: string
  weekStart: string
  weekEnd: string
  weekLabel: string
  totalHours: number
  hourlyRate: number
  totalAmount: number
  status: string
  submittedAt?: string
  paidAt?: string
  updatedAt: string
}

export interface GetDocketsHistoryInput {
  dateFrom?: string
  dateTo?: string
  builderId?: string
  locationId?: string
  supervisorId?: string
  contractorId?: string
  q?: string
  page?: number
  limit?: number
}

export interface GetPaymentsHistoryInput {
  dateFrom?: string
  dateTo?: string
  contractorId?: string
  status?: string
  q?: string
  page?: number
  limit?: number
}

export interface GetDocketsHistoryResponse {
  dockets: DocketHistoryItem[]
  page: number
  limit: number
  totalCount: number
  totalPages: number
  totals: {
    totalHours: number
    totalTonnageHours: number
    totalDayLabourHours: number
    totalEntries: number
  }
}

export interface GetPaymentsHistoryResponse {
  payments: PaymentHistoryItem[]
  page: number
  limit: number
  totalCount: number
  totalPages: number
  totals: {
    totalAmount: number
    totalHours: number
    totalInvoices: number
    paidAmount: number
    pendingAmount: number
  }
}

export interface ExportDocketsInput {
  dateFrom?: string
  dateTo?: string
  builderId?: string
  locationId?: string
  supervisorId?: string
  contractorId?: string
  q?: string
  format: 'csv' | 'xlsx'
}

export interface ExportPaymentsInput {
  dateFrom?: string
  dateTo?: string
  contractorId?: string
  status?: string
  q?: string
  format: 'csv' | 'xlsx'
}