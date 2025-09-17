"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Edit,
  CheckCircle,
  Download,
  Calendar,
  DollarSign,
  Clock,
  FileText,
  Filter,
  X
} from "lucide-react"
import { toast } from "sonner"
import { WorkerInvoiceStatus } from "@prisma/client"

interface AdminInvoiceListItem {
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

interface InvoicesResponse {
  success: boolean
  message: string
  data: AdminInvoiceListItem[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface EditFormData {
  totalHours: number
  hourlyRate: number
  totalAmount: number
  auditNote: string
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

export default function AdminWeeklyPaymentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [invoices, setInvoices] = useState<AdminInvoiceListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [weekFilter, setWeekFilter] = useState(searchParams.get('week') || "")
  const [editingInvoice, setEditingInvoice] = useState<AdminInvoiceListItem | null>(null)
  const [editForm, setEditForm] = useState<EditFormData>({
    totalHours: 0,
    hourlyRate: 0,
    totalAmount: 0,
    auditNote: ""
  })
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [weekFilter, searchQuery])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (weekFilter) params.set('week', weekFilter)
      if (searchQuery) params.set('q', searchQuery)

      const response = await fetch(`/api/invoices?${params.toString()}`, {
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
        throw new Error('Failed to fetch invoices')
      }

      const data: InvoicesResponse = await response.json()
      setInvoices(data.data)
    } catch (err) {
      console.error('Error fetching invoices:', err)
      setError('Failed to load invoices')
      toast.error('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const handleEditInvoice = (invoice: AdminInvoiceListItem) => {
    setEditingInvoice(invoice)
    setEditForm({
      totalHours: invoice.totalHours,
      hourlyRate: invoice.hourlyRate,
      totalAmount: invoice.totalAmount,
      auditNote: ""
    })
  }

  const handleUpdateInvoice = async () => {
    if (!editingInvoice) return

    try {
      setUpdating(true)

      const response = await fetch(`/api/invoices/${editingInvoice.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to update invoice')
      }

      toast.success('Invoice updated successfully!')
      setEditingInvoice(null)
      await fetchInvoices()

    } catch (err) {
      console.error('Error updating invoice:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update invoice'
      toast.error(errorMessage)
    } finally {
      setUpdating(false)
    }
  }

  const handleMarkPaid = async (invoice: AdminInvoiceListItem) => {
    try {
      setUpdating(true)

      const response = await fetch(`/api/invoices/${invoice.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'PAID',
          auditNote: 'Marked as paid by admin'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to mark invoice as paid')
      }

      toast.success('Invoice marked as paid!')
      await fetchInvoices()

    } catch (err) {
      console.error('Error marking invoice as paid:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark invoice as paid'
      toast.error(errorMessage)
    } finally {
      setUpdating(false)
    }
  }

  const handleExport = async () => {
    try {
      if (!weekFilter) {
        toast.error('Please select a week to export')
        return
      }

      const response = await fetch(`/api/invoices/export?week=${weekFilter}&format=csv`)

      if (!response.ok) {
        throw new Error('Failed to export invoices')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `invoices-${weekFilter}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Invoices exported successfully!')

    } catch (err) {
      console.error('Error exporting invoices:', err)
      toast.error('Failed to export invoices')
    }
  }

  const clearFilters = () => {
    setWeekFilter("")
    setSearchQuery("")
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Weekly Payments</h1>
            <p className="text-muted-foreground mt-2">
              Review and manage worker invoice payments
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
            <h2 className="text-xl font-semibold mb-2">Unable to load invoices</h2>
            <p className="text-muted-foreground mb-4 text-center">{error}</p>
            <Button onClick={fetchInvoices} variant="outline">
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
          <h1 className="text-3xl font-bold">Weekly Payments</h1>
          <p className="text-muted-foreground mt-2">
            Review and manage worker invoice payments
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={handleExport} variant="outline" size="sm" disabled={!weekFilter}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="week">Week</Label>
              <Input
                id="week"
                placeholder="e.g. 2025-W38"
                value={weekFilter}
                onChange={(e) => setWeekFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Search Nickname</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by nickname..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button onClick={clearFilters} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
              <p className="text-muted-foreground">
                No invoices match your current filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nickname</TableHead>
                    <TableHead>Week</TableHead>
                    <TableHead className="text-right">Total Hrs</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Total $</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{invoice.contractorNickname}</div>
                          {invoice.contractorFullName && (
                            <div className="text-xs text-muted-foreground">
                              {invoice.contractorFullName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{invoice.weekLabel}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <div className="flex items-center justify-end space-x-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>{invoice.totalHours.toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <div className="flex items-center justify-end space-x-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span>{invoice.hourlyRate.toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        <div className="flex items-center justify-end space-x-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span>{invoice.totalAmount.toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeVariant(invoice.status)}
                          className={getStatusColor(invoice.status)}
                        >
                          {invoice.status === 'DRAFT' && 'Draft'}
                          {invoice.status === 'SUBMITTED' && 'Submitted'}
                          {invoice.status === 'PAID' && 'Paid'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditInvoice(invoice)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Invoice</DialogTitle>
                                <DialogDescription>
                                  Update invoice details for {invoice.contractorNickname} - {invoice.weekLabel}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="totalHours" className="text-right">
                                    Total Hours
                                  </Label>
                                  <Input
                                    id="totalHours"
                                    type="number"
                                    step="0.01"
                                    className="col-span-3"
                                    value={editForm.totalHours}
                                    onChange={(e) => setEditForm(prev => ({
                                      ...prev,
                                      totalHours: parseFloat(e.target.value) || 0
                                    }))}
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="hourlyRate" className="text-right">
                                    Hourly Rate
                                  </Label>
                                  <Input
                                    id="hourlyRate"
                                    type="number"
                                    step="0.01"
                                    className="col-span-3"
                                    value={editForm.hourlyRate}
                                    onChange={(e) => setEditForm(prev => ({
                                      ...prev,
                                      hourlyRate: parseFloat(e.target.value) || 0
                                    }))}
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="totalAmount" className="text-right">
                                    Total Amount
                                  </Label>
                                  <Input
                                    id="totalAmount"
                                    type="number"
                                    step="0.01"
                                    className="col-span-3"
                                    value={editForm.totalAmount}
                                    onChange={(e) => setEditForm(prev => ({
                                      ...prev,
                                      totalAmount: parseFloat(e.target.value) || 0
                                    }))}
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="auditNote" className="text-right">
                                    Audit Note
                                  </Label>
                                  <Textarea
                                    id="auditNote"
                                    placeholder="Reason for changes..."
                                    className="col-span-3"
                                    value={editForm.auditNote}
                                    onChange={(e) => setEditForm(prev => ({
                                      ...prev,
                                      auditNote: e.target.value
                                    }))}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={handleUpdateInvoice}
                                  disabled={updating || !editForm.auditNote.trim()}
                                >
                                  {updating ? 'Updating...' : 'Update Invoice'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {invoice.status !== 'PAID' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="default" disabled={updating}>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Mark Paid
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Mark Invoice as Paid</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to mark this invoice as paid?
                                    <br />
                                    <br />
                                    <strong>Worker:</strong> {invoice.contractorNickname}
                                    <br />
                                    <strong>Week:</strong> {invoice.weekLabel}
                                    <br />
                                    <strong>Amount:</strong> ${invoice.totalAmount.toFixed(2)}
                                    <br />
                                    <br />
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleMarkPaid(invoice)}
                                  >
                                    Mark as Paid
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}