"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Search,
  Download,
  Calendar,
  Clock,
  FileText,
  Filter,
  X,
  DollarSign,
  CheckCircle,
  AlertCircle,
  User
} from "lucide-react"
import { toast } from "sonner"

interface PaymentHistoryItem {
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

interface PaymentsResponse {
  success: boolean
  message: string
  data: {
    payments: PaymentHistoryItem[]
    totals: {
      totalAmount: number
      totalHours: number
      totalInvoices: number
      paidAmount: number
      pendingAmount: number
    }
  }
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface FilterOptions {
  contractors: { id: string; nickname: string; fullName?: string }[]
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return "outline"
    case 'SUBMITTED':
      return "default"
    case 'PAID':
      return "secondary"
    default:
      return "outline"
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return "text-orange-600"
    case 'SUBMITTED':
      return "text-blue-600"
    case 'PAID':
      return "text-green-600"
    default:
      return "text-gray-600"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PAID':
      return <CheckCircle className="h-3 w-3" />
    case 'SUBMITTED':
      return <AlertCircle className="h-3 w-3" />
    default:
      return <FileText className="h-3 w-3" />
  }
}

export default function PaymentsHistoryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [payments, setPayments] = useState<PaymentHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totals, setTotals] = useState<any>(null)

  // Filters
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || "")
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || "")
  const [selectedContractor, setSelectedContractor] = useState<string | undefined>(searchParams.get('contractorId') || undefined)
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(searchParams.get('status') || undefined)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || "")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery)

  // Filter options
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    contractors: []
  })

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [dateFrom, dateTo, selectedContractor, selectedStatus, debouncedSearchQuery, page])

  const fetchFilterOptions = async () => {
    try {
      // Fetch contractors
      const contractorsResponse = await fetch('/api/contractors')
      if (contractorsResponse.ok) {
        const contractorsData = await contractorsResponse.json()
        setFilterOptions(prev => ({ ...prev, contractors: contractorsData.data || [] }))
      }

    } catch (err) {
      console.error('Error fetching filter options:', err)
    }
  }

  const fetchPayments = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      if (selectedContractor) params.set('contractorId', selectedContractor)
      if (selectedStatus) params.set('status', selectedStatus)
      if (debouncedSearchQuery) params.set('q', debouncedSearchQuery)
      params.set('page', page.toString())
      params.set('limit', '50')

      const response = await fetch(`/api/history/payments?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login')
          return
        }
        if (response.status === 403) {
          setError('Access denied. Admin access required.')
          return
        }
        throw new Error('Failed to fetch payments history')
      }

      const data: PaymentsResponse = await response.json()

      // Validate response structure and ensure we always have an array for payments
      if (data && data.success) {
        setPayments(Array.isArray(data.data?.payments) ? data.data.payments : [])
        setTotals(data.data?.totals || null)
        setTotalPages(data.meta?.totalPages || 1)
      } else {
        console.warn('API response indicates failure:', data.message || 'Unknown error')
        setPayments([])
        setTotals(null)
        setTotalPages(1)
      }

    } catch (err) {
      console.error('Error fetching payments history:', err)
      setError('Failed to load payments history')
      setPayments([]) // Ensure payments is always an array
      setTotals(null)
      setTotalPages(1)
      toast.error('Failed to load payments history')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      if (selectedContractor) params.set('contractorId', selectedContractor)
      if (selectedStatus) params.set('status', selectedStatus)
      if (debouncedSearchQuery) params.set('q', debouncedSearchQuery)
      params.set('format', 'csv')

      const response = await fetch(`/api/history/payments/export?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to export payments history')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `payments-history-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Payments history exported successfully!')

    } catch (err) {
      console.error('Error exporting payments history:', err)
      toast.error('Failed to export payments history')
    }
  }

  const clearFilters = () => {
    setDateFrom("")
    setDateTo("")
    setSelectedContractor(undefined)
    setSelectedStatus(undefined)
    setSearchQuery("")
    setPage(1)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payments History</h1>
            <p className="text-muted-foreground mt-2">
              View and export historical payment records
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to load payments history</h2>
            <p className="text-muted-foreground mb-4 text-center">{error}</p>
            <Button onClick={fetchPayments} variant="outline">
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments History</h1>
          <p className="text-muted-foreground mt-2">
            View and export historical payment records
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Totals Summary */}
      {totals && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="flex items-center p-6">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{totals.totalInvoices}</p>
                <p className="text-xs text-muted-foreground">Total Invoices</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Clock className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{totals.totalHours.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Total Hours</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <DollarSign className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">${totals.totalAmount.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Total Amount</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">${totals.paidAmount.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Paid Amount</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <AlertCircle className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">${totals.pendingAmount.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Pending Amount</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractor">Contractor</Label>
              <Select value={selectedContractor} onValueChange={setSelectedContractor}>
                <SelectTrigger>
                  <SelectValue placeholder="All Contractors" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.contractors.map((contractor) => (
                    <SelectItem key={contractor.id} value={contractor.id}>
                      {contractor.nickname} {contractor.fullName && `(${contractor.fullName})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by contractor nickname..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button onClick={clearFilters} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payments found</h3>
              <p className="text-muted-foreground">
                No payment records match your current filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contractor</TableHead>
                    <TableHead>Week</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.contractorNickname}</div>
                          {payment.contractorFullName && (
                            <div className="text-xs text-muted-foreground">
                              {payment.contractorFullName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{payment.weekLabel}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <div className="flex items-center justify-end space-x-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>{payment.totalHours.toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <div className="flex items-center justify-end space-x-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span>{payment.hourlyRate.toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        <div className="flex items-center justify-end space-x-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span>{payment.totalAmount.toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeVariant(payment.status)}
                          className={`${getStatusColor(payment.status)} flex items-center space-x-1`}
                        >
                          {getStatusIcon(payment.status)}
                          <span>
                            {payment.status === 'DRAFT' && 'Draft'}
                            {payment.status === 'SUBMITTED' && 'Submitted'}
                            {payment.status === 'PAID' && 'Paid'}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.submittedAt ? (
                          <span className="text-xs text-muted-foreground">
                            {new Date(payment.submittedAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {payment.paidAt ? (
                          <span className="text-xs text-green-600 font-medium">
                            {new Date(payment.paidAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}