"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import {
  Calendar,
  Clock,
  DollarSign,
  FileText,
  ArrowLeft,
  Receipt,
  Building,
  MapPin,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { WorkerInvoiceStatus } from "@prisma/client"

interface WorkSiteEntry {
  builderId: string
  builderName: string
  companyCode: string
  locationId: string
  locationLabel: string
  date: string
  tonnageHours: string
  dayLabourHours: string
  totalHours: string
}

interface WeekDetails {
  weekStart: string
  weekEnd: string
  weekLabel: string
  hourlyRate: string
  entries: WorkSiteEntry[]
  totalHours: string
  totalAmount: string
  status: WorkerInvoiceStatus
  invoiceId?: string
  canSubmit: boolean
}

interface WeekDetailsResponse {
  success: boolean
  message: string
  data: WeekDetails
}

interface CreateInvoiceApiResponse {
  success: boolean
  message: string
  data: {
    success: boolean
    invoiceId: string
    message: string
  }
}

const getStatusBadgeVariant = (status: WorkerInvoiceStatus) => {
  switch (status) {
    case WorkerInvoiceStatus.DRAFT:
      return "outline"
    case WorkerInvoiceStatus.SUBMITTED:
      return "default"
    case WorkerInvoiceStatus.PAID:
      return "secondary"
    default:
      return "outline"
  }
}

const getStatusColor = (status: WorkerInvoiceStatus) => {
  switch (status) {
    case WorkerInvoiceStatus.DRAFT:
      return "text-orange-600"
    case WorkerInvoiceStatus.SUBMITTED:
      return "text-blue-600"
    case WorkerInvoiceStatus.PAID:
      return "text-green-600"
    default:
      return "text-gray-600"
  }
}

export default function WeekDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const week = params.week as string

  const [details, setDetails] = useState<WeekDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (week) {
      fetchWeekDetails()
    }
  }, [week])

  const fetchWeekDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/me/weeks/${week}`, {
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
          setError('Access denied. This page is for workers only.')
          return
        }
        if (response.status === 404) {
          setError('No timesheet data found for this week.')
          return
        }
        throw new Error('Failed to fetch week details')
      }

      const data: WeekDetailsResponse = await response.json()
      setDetails(data.data)
    } catch (err) {
      console.error('Error fetching week details:', err)
      setError('Failed to load timesheet details')
      toast.error('Failed to load timesheet details')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitInvoice = async () => {
    if (!details) return

    try {
      setSubmitting(true)

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekStart: details.weekStart,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to submit invoice')
      }

      const data: CreateInvoiceApiResponse = await response.json()

      toast.success('Invoice submitted successfully! Director has been notified.')

      // Refresh the details to show updated status
      await fetchWeekDetails()

    } catch (err) {
      console.error('Error submitting invoice:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit invoice'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleBack = () => {
    router.push('/dashboard/me/weeks?refresh=true')
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-9 w-9" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Week Details</h1>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to load week details</h2>
            <p className="text-muted-foreground mb-4 text-center">{error}</p>
            <div className="flex space-x-2">
              <Button onClick={fetchWeekDetails} variant="outline">
                Try again
              </Button>
              <Button onClick={handleBack} variant="ghost">
                Back to weeks
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!details) return null

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{details.weekLabel}</h1>
            <p className="text-muted-foreground mt-2">
              Timesheet details and submission
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Badge
            variant={getStatusBadgeVariant(details.status)}
            className={getStatusColor(details.status)}
          >
            {details.status === WorkerInvoiceStatus.DRAFT && 'Unsubmitted'}
            {details.status === WorkerInvoiceStatus.SUBMITTED && 'Submitted'}
            {details.status === WorkerInvoiceStatus.PAID && 'Paid'}
          </Badge>

          {details.canSubmit && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Receipt className="h-4 w-4" />
                  <span>Submit Invoice</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit Invoice</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to submit this invoice for {details.weekLabel}?
                    <br />
                    <br />
                    <strong>Total Hours:</strong> {details.totalHours}
                    <br />
                    <strong>Total Amount:</strong> ${details.totalAmount}
                    <br />
                    <br />
                    Once submitted, an email will be sent to the director and you cannot modify this invoice.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleSubmitInvoice}
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Invoice'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Hourly Rate</span>
              <span className="text-sm">${details.hourlyRate}/hr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Total Hours</span>
              </span>
              <span className="text-sm font-mono">{details.totalHours}</span>
            </div>
            <div className="border-t pt-4 flex justify-between">
              <span className="font-semibold flex items-center space-x-1">
                <DollarSign className="h-4 w-4" />
                <span>Total Amount</span>
              </span>
              <span className="font-semibold text-lg">${details.totalAmount}</span>
            </div>
            {details.status === WorkerInvoiceStatus.SUBMITTED && (
              <div className="bg-blue-50 p-3 rounded-lg flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">Invoice submitted successfully</span>
              </div>
            )}
            {details.status === WorkerInvoiceStatus.PAID && (
              <div className="bg-green-50 p-3 rounded-lg flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">Invoice has been paid</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Work Details Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Work Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Builder</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Tonnage</TableHead>
                    <TableHead className="text-right">Day Labour</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.entries.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{entry.date}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{entry.builderName}</div>
                            <div className="text-xs text-muted-foreground">({entry.companyCode})</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>{entry.locationLabel}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.tonnageHours}h
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.dayLabourHours}h
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {entry.totalHours}h
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {details.entries.length === 0 && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No work entries</h3>
                <p className="text-muted-foreground">
                  No work entries found for this week.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}