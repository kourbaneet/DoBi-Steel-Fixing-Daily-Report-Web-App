"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { startOfWeek, endOfWeek, format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Calendar,
  Clock,
  DollarSign,
  FileText,
  ArrowRight,
  Receipt,
  Eye,
  MapPin,
  Building2,
  Hammer,
  Truck,
  TrendingUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { WorkerInvoiceStatus } from "@prisma/client"

interface LocationBreakdown {
  locationLabel: string
  companyCode: string
  dayLabourHours: number
  tonnageHours: number
  totalHours: number
  totalAmount: number
  daysWorked: number
}

interface WeekSummary {
  weekStart: string
  weekEnd: string
  weekLabel: string
  totalHours: string
  dayLabourHours: string
  tonnageHours: string
  totalAmount: string
  status: WorkerInvoiceStatus
  invoiceId?: string
  canSubmit: boolean
  locationBreakdown: LocationBreakdown[]
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
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set())
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedWeekRange, setSelectedWeekRange] = useState<string>("")
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

      // Expand the first card by default
      if (data.data.length > 0) {
        setExpandedWeeks(new Set([data.data[0].weekStart]))
      }
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

  const toggleWeekExpansion = (weekStart: string) => {
    const newExpanded = new Set(expandedWeeks)
    if (newExpanded.has(weekStart)) {
      newExpanded.delete(weekStart)
    } else {
      newExpanded.add(weekStart)
    }
    setExpandedWeeks(newExpanded)
  }

  // Get Monday of the week for any date using date-fns (UTC)
  const getWeekStart = (date: Date) => {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }) // Monday = 1
    // Convert to UTC to avoid timezone issues
    return new Date(Date.UTC(
      weekStart.getFullYear(),
      weekStart.getMonth(),
      weekStart.getDate(),
      0, 0, 0, 0
    ))
  }

  // Get Sunday of the week for any date using date-fns (UTC)
  const getWeekEnd = (date: Date) => {
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 }) // Monday = 1
    // Convert to UTC - keep it at start of Sunday (00:00:00) for proper 7-day calculation
    return new Date(Date.UTC(
      weekEnd.getFullYear(),
      weekEnd.getMonth(),
      weekEnd.getDate(),
      0, 0, 0, 0
    ))
  }

  // Format week range string using date-fns
  const formatWeekRange = (startDate: Date, endDate: Date) => {
    const startStr = format(startDate, 'MMM dd')
    const endStr = format(endDate, 'MMM dd, yyyy')
    return `${startStr} - ${endStr}`
  }

  // Get ISO week string for API
  const getISOWeekString = (date: Date) => {
    const year = date.getFullYear()
    const jan4 = new Date(year, 0, 4)
    const jan4Day = jan4.getDay() || 7
    const week1Start = new Date(jan4.getTime() - (jan4Day - 1) * 86400000)
    const weekNumber = Math.floor((date.getTime() - week1Start.getTime()) / (7 * 86400000)) + 1
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`
  }

  // Handle calendar date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    setSelectedDate(date)
    setShowCalendar(false)

    const weekStart = getWeekStart(date)
    const weekEnd = getWeekEnd(date)
    const weekRange = formatWeekRange(weekStart, weekEnd)

    setSelectedWeekRange(weekRange)

    // Fetch data for this specific week using the weeks list API
    fetchWeekData(date)
  }

  // Fetch data for specific week using the weeks list API with filtering
  const fetchWeekData = async (selectedDate: Date) => {
    try {
      setLoading(true)

      // Calculate week boundaries
      const weekStart = getWeekStart(selectedDate)
      const weekEnd = getWeekEnd(selectedDate)

      console.log('Selected date:', selectedDate)
      console.log('Selected date day of week:', selectedDate.getDay()) // 0=Sunday, 1=Monday, etc.
      console.log('Calculated week start:', weekStart)
      console.log('Calculated week end:', weekEnd)
      console.log('Week range display:', formatWeekRange(weekStart, weekEnd))
      console.log('Days difference:', Math.floor((weekEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)))

      // Build query parameters with week filter
      // For API, we need to include the full Sunday, so add end of day to weekEnd
      const apiWeekEnd = new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000 - 1) // End of Sunday

      const params = new URLSearchParams({
        limit: '1',
        weekStart: weekStart.toISOString(),
        weekEnd: apiWeekEnd.toISOString()
      })

      console.log('API URL:', `/api/me/weeks?${params}`)

      const response = await fetch(`/api/me/weeks?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data: WeeksResponse = await response.json()
        console.log('API Response:', data) // Debug log

        if (data.data && data.data.length > 0) {
          setWeeks(data.data)
          // Expand the first (and likely only) card by default
          setExpandedWeeks(new Set([data.data[0].weekStart]))
        } else {
          // No data for this week - show empty week structure
          const emptyWeek: WeekSummary = {
            weekStart: weekStart.toISOString(),
            weekEnd: weekEnd.toISOString(),
            weekLabel: formatWeekRange(weekStart, weekEnd),
            totalHours: "0.00",
            dayLabourHours: "0.00",
            tonnageHours: "0.00",
            totalAmount: "0.00",
            status: WorkerInvoiceStatus.DRAFT,
            canSubmit: false,
            locationBreakdown: []
          }
          setWeeks([emptyWeek])
          // Expand the empty week card by default
          setExpandedWeeks(new Set([emptyWeek.weekStart]))
        }
      } else {
        // API errors (403, 500, etc.)
        setWeeks([])
        const errorText = await response.text()
        console.error(`API error ${response.status}:`, errorText)
        toast.error(`Failed to load week data (${response.status})`)
      }
    } catch (err) {
      console.error('Error fetching week data:', err)
      toast.error('Failed to load week data')
      setWeeks([])
    } finally {
      setLoading(false)
    }
  }

  // Reset to default view
  const resetToDefaultView = () => {
    setSelectedDate(undefined)
    setSelectedWeekRange("")
    fetchWeeks()
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
            View and submit your weekly timesheets. Click on cards to expand location details.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Popover open={showCalendar} onOpenChange={setShowCalendar}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>{selectedWeekRange || "Select Week"}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
                disabled={(date) => {
                  // Disable future dates (only allow current and past dates)
                  const today = new Date()
                  today.setHours(23, 59, 59, 999) // End of today
                  return date > today
                }}
                fromYear={2020}
                toYear={new Date().getFullYear()}
              />
            </PopoverContent>
          </Popover>

          {selectedWeekRange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefaultView}
              className="flex items-center space-x-1 text-muted-foreground hover:text-foreground"
            >
              <span>×</span>
              <span>Clear</span>
            </Button>
          )}
        </div>
      </div>


      <div className="grid gap-4">
        {weeks.map((week) => {
          // Use breakdown data directly from week summary
          const dayLabourHours = parseFloat(week.dayLabourHours) || 0
          const tonnageHours = parseFloat(week.tonnageHours) || 0
          const locationBreakdown = week.locationBreakdown || []
          const isExpanded = expandedWeeks.has(week.weekStart)

          return (
            <Card
              key={week.weekStart}
              className="cursor-pointer transition-all duration-200 hover:shadow-md hover:ring-1 hover:ring-gray-300"
              onClick={() => toggleWeekExpansion(week.weekStart)}
            >
              <CardContent className="p-6">
                {/* Week Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">{week.weekLabel}</h3>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`} />
                      <span className="text-sm text-muted-foreground">
                        ({new Date(week.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(week.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                      </span>
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
                          <span>Submit</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3" />
                          <span>Details</span>
                        </>
                      )}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Quick Summary Row */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="h-4 w-4 text-blue-600 mr-1" />
                      <span className="text-sm font-medium text-blue-600">Total Hours</span>
                    </div>
                    <div className="text-xl font-bold">{week.totalHours}h</div>
                  </div>

                  <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
                    <div className="flex items-center justify-center mb-1">
                      <Hammer className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm font-medium text-green-600">Day Labour</span>
                    </div>
                    <div className="text-xl font-bold">{dayLabourHours.toFixed(1)}h</div>
                  </div>

                  <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                    <div className="flex items-center justify-center mb-1">
                      <Truck className="h-4 w-4 text-purple-600 mr-1" />
                      <span className="text-sm font-medium text-purple-600">Tonnage</span>
                    </div>
                    <div className="text-xl font-bold">{tonnageHours.toFixed(1)}h</div>
                  </div>

                  <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                    <div className="flex items-center justify-center mb-1">
                      <DollarSign className="h-4 w-4 text-orange-600 mr-1" />
                      <span className="text-sm font-medium text-orange-600">Total Pay</span>
                    </div>
                    <div className="text-xl font-bold">${week.totalAmount}</div>
                  </div>
                </div>

                {/* Location Breakdown */}
                {isExpanded && locationBreakdown.length > 0 && (
                  <div className="border-t pt-4 space-y-4">
                    <h4 className="font-semibold flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Location Breakdown
                    </h4>

                    <div className="overflow-x-auto">
                      <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Company</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead className="text-center">Days Worked</TableHead>
                              <TableHead className="text-right">Day Labour</TableHead>
                              <TableHead className="text-right">Tonnage</TableHead>
                              <TableHead className="text-right">Total Hours</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {locationBreakdown.map((location, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <div className="flex items-center">
                                    <Building2 className="h-3 w-3 mr-1 text-muted-foreground" />
                                    <span className="font-mono text-xs">{location.companyCode}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                                    <span className="text-sm">{location.locationLabel}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">{location.daysWorked}</TableCell>
                                <TableCell className="text-right">{location.dayLabourHours.toFixed(1)}h</TableCell>
                                <TableCell className="text-right">{location.tonnageHours.toFixed(1)}h</TableCell>
                                <TableCell className="text-right font-semibold">{location.totalHours.toFixed(1)}h</TableCell>
                                <TableCell className="text-right font-semibold">${location.totalAmount.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                            {/* Totals Row */}
                            <TableRow className="bg-muted/50 font-semibold">
                              <TableCell colSpan={3} className="text-right">Totals:</TableCell>
                              <TableCell className="text-right">
                                {locationBreakdown.reduce((sum, loc) => sum + loc.dayLabourHours, 0).toFixed(1)}h
                              </TableCell>
                              <TableCell className="text-right">
                                {locationBreakdown.reduce((sum, loc) => sum + loc.tonnageHours, 0).toFixed(1)}h
                              </TableCell>
                              <TableCell className="text-right">
                                {locationBreakdown.reduce((sum, loc) => sum + loc.totalHours, 0).toFixed(1)}h
                              </TableCell>
                              <TableCell className="text-right">
                                ${locationBreakdown.reduce((sum, loc) => sum + loc.totalAmount, 0).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {weeks.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {weeks.length} weeks of timesheet data
        </div>
      )}
    </div>
  )
}