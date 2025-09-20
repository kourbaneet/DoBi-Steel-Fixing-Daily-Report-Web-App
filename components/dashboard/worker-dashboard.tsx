"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
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
  Clock,
  DollarSign,
  FileText,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  TrendingUp,
  Hammer,
  Truck,
  BarChart3,
  PieChart,
  Activity,
  Receipt,
  Eye,
  Download,
  Building2,
  CalendarDays,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts"

interface WorkerDashboardData {
  kpis: {
    thisWeekHours: {
      dayLabour: number
      tonnage: number
      combined: number
    }
    estimatedPay: number
    hourlyRate: number
    docketsCounted: number
    sitesWorked: number
  }
  charts: {
    hoursByDay: Array<{
      day: string
      dayName: string
      dayLabour: number
      tonnage: number
      total: number
    }>
    sitesSummary: Array<{
      locationName: string
      builderName: string
      totalHours: number
      percentage: number
    }>
    weeklyTrend: Array<{
      weekStart: string
      weekLabel: string
      totalHours: number
      year: number
      weekNumber: number
    }>
  }
  tables: {
    weekBreakdown: Array<{
      date: string
      dayName: string
      companyCode: string
      locationLabel: string
      dayLabour: number
      tonnage: number
      total: number
      docketId: string
    }>
    recentInvoices: Array<{
      id: string
      weekLabel: string
      weekStart: string
      totalHours: number
      hourlyRate: number
      totalAmount: number
      status: string
      submittedAt: string | null
      paidAt: string | null
    }>
  }
  weekInfo: {
    weekNumber: number
    year: number
    startDate: string
    endDate: string
  }
}

export function WorkerDashboard() {
  const { data: session } = useSession()
  const [dashboardData, setDashboardData] = useState<WorkerDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState<string>('')

  useEffect(() => {
    // Initialize with current ISO week
    const today = new Date()
    const currentISOWeek = getISOWeekString(today)
    setCurrentWeek(currentISOWeek)
  }, [])

  useEffect(() => {
    if (currentWeek) {
      fetchDashboardData()
    }
  }, [currentWeek])

  // Helper function to get ISO week string (YYYY-WXX format)
  const getISOWeekString = (date: Date): string => {
    const year = date.getFullYear()
    const week = getISOWeek(date)
    return `${year}-W${week.toString().padStart(2, '0')}`
  }

  // Helper function to get ISO week number
  const getISOWeek = (date: Date): number => {
    const target = new Date(date.valueOf())
    const dayNumber = (date.getDay() + 6) % 7
    target.setDate(target.getDate() - dayNumber + 3)
    const firstThursday = target.valueOf()
    target.setMonth(0, 1)
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
  }

  // Helper function to get week dates from ISO week string
  const getWeekDates = (weekString: string): { start: Date; end: Date } => {
    const [year, weekStr] = weekString.split('-W')
    const week = parseInt(weekStr)

    const jan4 = new Date(parseInt(year), 0, 4)
    const jan4Day = (jan4.getDay() + 6) % 7

    const week1Monday = new Date(jan4)
    week1Monday.setDate(jan4.getDate() - jan4Day)

    const targetMonday = new Date(week1Monday)
    targetMonday.setDate(week1Monday.getDate() + (week - 1) * 7)

    const targetSunday = new Date(targetMonday)
    targetSunday.setDate(targetMonday.getDate() + 6)

    return { start: targetMonday, end: targetSunday }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboard/worker?week=${currentWeek}`)

      if (response.ok) {
        const result = await response.json()
        setDashboardData(result.data)
      } else {
        console.error("Failed to fetch worker dashboard data:", response.status, response.statusText)
        setDashboardData(null)
      }
    } catch (error) {
      console.error("Error fetching worker dashboard data:", error)
      setDashboardData(null)
    } finally {
      setLoading(false)
    }
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const weekDates = getWeekDates(currentWeek)
    const newDate = new Date(weekDates.start)

    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() + 7)
    }

    setCurrentWeek(getISOWeekString(newDate))
  }


  const formatWeekDisplay = () => {
    if (!currentWeek) return ''
    const [year, weekStr] = currentWeek.split('-W')
    const weekDates = getWeekDates(currentWeek)
    const start = weekDates.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const end = weekDates.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `Week ${parseInt(weekStr)}, ${year} (${start} - ${end})`
  }

  const handleTrendPointClick = (data: any) => {
    if (data && data.year && data.weekNumber) {
      const weekString = `${data.year}-W${data.weekNumber.toString().padStart(2, '0')}`
      setCurrentWeek(weekString)
    }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Worker Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Track your hours, earnings and submit invoices
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {session?.user?.name || 'Worker'}
          </Badge>
        </div>
      </div>

      {/* Top Controls - Week Selector */}
      <Card className="p-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Week:</span>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('prev')}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="text-sm font-medium min-w-0 px-2">
                {loading ? 'Loading...' : formatWeekDisplay()}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('next')}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => navigateWeek('prev')} size="sm">
              Last Week
            </Button>
            <Button variant="outline" onClick={() => navigateWeek('next')} size="sm">
              Next Week
            </Button>
          </div>
        </div>
      </Card>

      {/* KPI Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            {/* 1. This Week Hours */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week Hours</CardTitle>
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-2">
                  {(dashboardData?.kpis.thisWeekHours.combined ?? 0).toFixed(1)}h
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center">
                      <Hammer className="h-3 w-3 mr-1" />
                      Day-labour:
                    </span>
                    <span className="font-medium">{(dashboardData?.kpis.thisWeekHours.dayLabour ?? 0).toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center">
                      <Truck className="h-3 w-3 mr-1" />
                      Tonnage:
                    </span>
                    <span className="font-medium">{(dashboardData?.kpis.thisWeekHours.tonnage ?? 0).toFixed(1)}h</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Estimated Pay */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Estimated Pay</CardTitle>
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(dashboardData?.kpis.estimatedPay ?? 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Estimate</p>
              </CardContent>
            </Card>

            {/* 3. My Rate/Hr */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">My Rate/Hr</CardTitle>
                <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(dashboardData?.kpis.hourlyRate ?? 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Per hour</p>
              </CardContent>
            </Card>

            {/* 4. Dockets Counted */}
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">Dockets Counted</CardTitle>
                <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.kpis.docketsCounted || 0}</div>
                <p className="text-xs text-muted-foreground">Submitted dockets</p>
              </CardContent>
            </Card>

            {/* 5. Sites Worked */}
            <Card className="border-l-4 border-l-indigo-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Sites Worked</CardTitle>
                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.kpis.sitesWorked || 0}</div>
                <p className="text-xs text-muted-foreground">Different locations</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* A) Hours by Day (Mon-Sat) - Bar Chart */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span>Daily Hours</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData?.charts.hoursByDay || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dayName" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, name) => [
                        `${Number(value).toFixed(1)}h`,
                        name === 'dayLabour' ? 'Day Labour' : 'Tonnage'
                      ]}
                    />
                    <Bar dataKey="dayLabour" stackId="a" fill="#10b981" name="Day Labour" />
                    <Bar dataKey="tonnage" stackId="a" fill="#3b82f6" name="Tonnage" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* B) Sites This Week - Donut Chart */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-indigo-600" />
              <span>Sites This Week</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <div className="h-48">
                {(dashboardData?.charts.sitesSummary || []).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={dashboardData.charts.sitesSummary}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="totalHours"
                        nameKey="locationName"
                      >
                        {dashboardData.charts.sitesSummary.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 137.5 % 360}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name, props) => [
                          `${Number(value).toFixed(1)}h (${((value as number) / (dashboardData?.kpis.thisWeekHours.combined || 1) * 100).toFixed(1)}%)`,
                          props.payload.locationName
                        ]}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    No site data available
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* C) Weekly Trend (Last 6 Weeks) - Line Chart */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-600" />
              <span>6-Week Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData?.charts.weeklyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="weekLabel"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [
                        `${Number(value).toFixed(1)}h`,
                        'Total Hours'
                      ]}
                      labelFormatter={(label, payload) => {
                        const data = payload?.[0]?.payload
                        return data ? `${label} (${data.weekStart})` : label
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalHours"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4, cursor: 'pointer' }}
                      activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, cursor: 'pointer' }}
                      onClick={handleTrendPointClick}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* D) This Week Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5 text-purple-600" />
              <span>This Week Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Day-labour</TableHead>
                      <TableHead className="text-right">Tonnage</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(dashboardData?.tables.weekBreakdown || []).map((entry) => (
                      <TableRow key={`${entry.docketId}-${entry.date}`}>
                        <TableCell className="font-medium">
                          <div>
                            {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            <div className="text-xs text-muted-foreground">{entry.dayName}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-mono">{entry.companyCode}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{entry.locationLabel}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{entry.dayLabour.toFixed(1)}h</TableCell>
                        <TableCell className="text-right">{entry.tonnage.toFixed(1)}h</TableCell>
                        <TableCell className="text-right font-semibold">{entry.total.toFixed(1)}h</TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    {(dashboardData?.tables.weekBreakdown || []).length > 0 && (
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={3} className="text-right">Totals:</TableCell>
                        <TableCell className="text-right">
                          {(dashboardData?.tables.weekBreakdown || [])
                            .reduce((sum, entry) => sum + entry.dayLabour, 0)
                            .toFixed(1)}h
                        </TableCell>
                        <TableCell className="text-right">
                          {(dashboardData?.tables.weekBreakdown || [])
                            .reduce((sum, entry) => sum + entry.tonnage, 0)
                            .toFixed(1)}h
                        </TableCell>
                        <TableCell className="text-right">
                          {(dashboardData?.tables.weekBreakdown || [])
                            .reduce((sum, entry) => sum + entry.total, 0)
                            .toFixed(1)}h
                        </TableCell>
                      </TableRow>
                    )}
                    {(dashboardData?.tables.weekBreakdown || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No work records for this week
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* E) Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              <span>Recent Invoices</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {(dashboardData?.tables.recentInvoices || []).length > 0 ? (
                  dashboardData.tables.recentInvoices.map((invoice) => (
                    <div key={invoice.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-sm">{invoice.weekLabel}</span>
                          <Badge
                            variant={
                              invoice.status === 'PAID' ? 'default' :
                              invoice.status === 'SUBMITTED' ? 'secondary' :
                              'outline'
                            }
                            className="text-xs"
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                        <Button size="sm" variant="ghost" className="h-6 px-2">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>Hours: <span className="font-medium text-foreground">{invoice.totalHours.toFixed(1)}h</span></div>
                        <div>Rate: <span className="font-medium text-foreground">${invoice.hourlyRate.toFixed(2)}/h</span></div>
                        <div>Total: <span className="font-medium text-foreground">${invoice.totalAmount.toFixed(2)}</span></div>
                        <div>
                          {invoice.status === 'PAID' && invoice.paidAt ? (
                            <>Paid: <span className="font-medium text-green-600">{new Date(invoice.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></>
                          ) : invoice.status === 'SUBMITTED' && invoice.submittedAt ? (
                            <>Submitted: <span className="font-medium text-blue-600">{new Date(invoice.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></>
                          ) : (
                            <>Week: <span className="font-medium text-foreground">{new Date(invoice.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No invoices found
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}