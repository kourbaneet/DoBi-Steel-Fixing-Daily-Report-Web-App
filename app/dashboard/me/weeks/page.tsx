"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Calendar,
  Clock,
  DollarSign,
  FileText,
  ArrowRight,
  Receipt,
  Eye,
} from "lucide-react"
import { toast } from "sonner"
import { WorkerInvoiceStatus } from "@prisma/client"

interface WeekSummary {
  weekStart: string
  weekEnd: string
  weekLabel: string
  totalHours: string
  totalAmount: string
  status: WorkerInvoiceStatus
  invoiceId?: string
  canSubmit: boolean
}

interface WeeksResponse {
  message: string
  data: WeekSummary[]
  meta: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
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

export default function WorkerWeeksPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [weeks, setWeeks] = useState<WeekSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWeeks()

    // If refresh parameter is present, remove it from URL after fetching
    if (searchParams.get('refresh')) {
      router.replace('/dashboard/me/weeks', { scroll: false })
    }
  }, [searchParams, router])

  const fetchWeeks = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/me/weeks', {
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
        throw new Error('Failed to fetch weeks')
      }

      const data: WeeksResponse = await response.json()
      setWeeks(data.data)
    } catch (err) {
      console.error('Error fetching weeks:', err)
      setError('Failed to load your timesheet data')
      toast.error('Failed to load your timesheet data')
    } finally {
      setLoading(false)
    }
  }

  const handleViewWeek = (weekStart: string) => {
    const weekString = new Date(weekStart).toISOString().split('T')[0] // Convert to YYYY-MM-DD
    const year = new Date(weekStart).getFullYear()
    const weekNumber = getWeekNumber(new Date(weekStart))
    const weekParam = `${year}-W${weekNumber.toString().padStart(2, '0')}`
    router.push(`/dashboard/me/weeks/${weekParam}`)
  }

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Timesheets</h1>
            <p className="text-muted-foreground mt-2">
              View and submit your weekly timesheets
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to load timesheets</h2>
            <p className="text-muted-foreground mb-4 text-center">{error}</p>
            <Button onClick={fetchWeeks} variant="outline">
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (weeks.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Timesheets</h1>
            <p className="text-muted-foreground mt-2">
              View and submit your weekly timesheets
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No timesheets found</h2>
            <p className="text-muted-foreground text-center">
              You don&apos;t have any recorded hours yet. Hours will appear here once you&apos;ve been added to dockets.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Timesheets</h1>
          <p className="text-muted-foreground mt-2">
            View and submit your weekly timesheets
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {weeks.map((week) => (
          <Card key={week.weekStart} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">{week.weekLabel}</h3>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{week.totalHours} hours</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3" />
                      <span>${week.totalAmount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge
                    variant={getStatusBadgeVariant(week.status)}
                    className={getStatusColor(week.status)}
                  >
                    {week.status === WorkerInvoiceStatus.DRAFT && 'Unsubmitted'}
                    {week.status === WorkerInvoiceStatus.SUBMITTED && 'Submitted'}
                    {week.status === WorkerInvoiceStatus.PAID && 'Paid'}
                  </Badge>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewWeek(week.weekStart)}
                    className="flex items-center space-x-1"
                  >
                    {week.status === WorkerInvoiceStatus.DRAFT ? (
                      <>
                        <Receipt className="h-3 w-3" />
                        <span>View & Submit</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3" />
                        <span>View Details</span>
                      </>
                    )}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {weeks.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {weeks.length} weeks of timesheet data
        </div>
      )}
    </div>
  )
}