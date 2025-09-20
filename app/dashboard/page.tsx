"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  FileText,
  DollarSign,
  Clock,
  TrendingUp,
  Calendar,
  Receipt,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit,
  Camera,
  Activity,
  BarChart3,
  Building2,
  HardHat,
  MapPin,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"
import { SupervisorDashboard } from "@/components/dashboard/supervisor-dashboard"
import { WorkerDashboard } from "@/components/dashboard/worker-dashboard"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface AdminDashboardData {
  kpis: {
    totalDockets: number
    uniqueContractors: number
    totalHours: {
      tonnage: number
      dayLabour: number
      combined: number
    }
    estimatedPayout: number
    invoices: {
      submitted: number
      paid: number
      unsubmitted: number
    }
  }
  charts: {
    hoursByDay: Array<{
      day: string
      dayName: string
      tonnage: number
      dayLabour: number
      total: number
    }>
    topCompanies: Array<{
      companyCode: string
      companyName: string
      totalHours: number
    }>
    topContractors: Array<{
      contractorId: string
      nickname: string
      totalHours: number
      estimatedPayout: number
    }>
  }
  tables: {
    pendingInvoices: Array<{
      id: string
      contractorNickname: string
      weekLabel: string
      totalHours: number
      totalAmount: number
      status: string
      submittedAt: string
    }>
    exceptions: Array<{
      id: string
      type: string
      contractorNickname: string
      message: string
      date: string
    }>
  }
  recentDockets: Array<{
    id: string
    date: string
    builderName: string
    companyCode: string
    locationLabel: string
    contractorCount: number
    totalHours: number
    mediaCount: number
    status: string
  }>
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isAdmin, isSupervisor, isWorker, userRole } = usePermissions()
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(() => {
    // Default to current week
    const end = new Date()
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
    return { start, end }
  })

  useEffect(() => {
    if (session && isAdmin) {
      fetchDashboardData()
    } else {
      setLoading(false)
    }
  }, [session, isAdmin, dateRange])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
      })

      const response = await fetch(`/api/dashboard/admin?${params}`)
      if (!response.ok) throw new Error("Failed to fetch dashboard data")

      const result = await response.json()
      setDashboardData(result.data)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Show loading state while session is loading
  if (status === "loading") {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
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
          ))}
        </div>
      </div>
    )
  }

  // Worker Dashboard
  if (isWorker) {
    return <WorkerDashboard />
  }

  // Supervisor Dashboard
  if (isSupervisor) {
    return <SupervisorDashboard />
  }

  // Admin Dashboard (default for ADMIN role)
  if (isAdmin) {
    return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Steel Operations Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Real-time insights into construction operations and workforce management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <Activity className="h-3 w-3" />
            <span>Live Data</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {new Date().toLocaleDateString('en-AU', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Badge>
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Date Range:</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => {
                  const newStart = new Date(e.target.value)
                  setDateRange(prev => ({ ...prev, start: newStart }))
                }}
                className="px-3 py-1 text-sm border rounded-md bg-background"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <input
                type="date"
                value={dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => {
                  const newEnd = new Date(e.target.value)
                  newEnd.setHours(23, 59, 59, 999)
                  setDateRange(prev => ({ ...prev, end: newEnd }))
                }}
                className="px-3 py-1 text-sm border rounded-md bg-background"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const end = new Date()
                const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
                setDateRange({ start, end })
              }}
            >
              This Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const end = new Date()
                const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
                setDateRange({ start, end })
              }}
            >
              Last 30 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                const start = new Date(today.getFullYear(), today.getMonth(), 1)
                const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
                end.setHours(23, 59, 59, 999)
                setDateRange({ start, end })
              }}
            >
              This Month
            </Button>
          </div>
        </div>
      </Card>

      {/* Row 1: KPI Cards */}
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
            {/* Total Dockets */}
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500" onClick={() => router.push("/dashboard/dockets")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Total Dockets</CardTitle>
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.kpis.totalDockets || 0}</div>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-muted-foreground">In selected range</p>
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                </div>
              </CardContent>
            </Card>

            {/* Unique Contractors */}
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500" onClick={() => router.push("/dashboard/contractors")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">Active Workers</CardTitle>
                <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <HardHat className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.kpis.uniqueContractors || 0}</div>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-muted-foreground">Worked in range</p>
                  <Zap className="h-3 w-3 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            {/* Total Hours - Gradient Style */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-300 mb-2">
                  {(dashboardData?.kpis.totalHours.combined ?? 0).toFixed(1)}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tonnage:</span>
                    <span className="font-medium">{(dashboardData?.kpis.totalHours.tonnage ?? 0).toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Day Labour:</span>
                    <span className="font-medium">{(dashboardData?.kpis.totalHours.dayLabour ?? 0).toFixed(1)}h</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estimated Payout */}
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500" onClick={() => router.push("/dashboard/admin/weekly-payments")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Est. Payout</CardTitle>
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {formatCurrency(dashboardData?.kpis.estimatedPayout ?? 0)}
                </div>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-muted-foreground">Contractor earnings</p>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                </div>
              </CardContent>
            </Card>

            {/* Invoice Status - Modern Card Style */}
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 relative overflow-hidden" onClick={() => router.push("/dashboard/admin/weekly-payments")}>
              <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Invoice Pipeline</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="relative">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                    <div className="text-xl font-bold text-red-600">{dashboardData?.kpis.invoices.unsubmitted || 0}</div>
                    <div className="text-xs text-red-600 font-medium">Draft</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                    <div className="text-xl font-bold text-blue-600">{dashboardData?.kpis.invoices.submitted || 0}</div>
                    <div className="text-xs text-blue-600 font-medium">Pending</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-950/30">
                    <div className="text-xl font-bold text-green-600">{dashboardData?.kpis.invoices.paid || 0}</div>
                    <div className="text-xs text-green-600 font-medium">Paid</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Row 2: Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Hours by Day - Stacked Bar Chart */}
        <Card className="md:col-span-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 rounded-t-lg">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span>Daily Workforce Hours</span>
              </div>
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                Weekly Breakdown
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData?.charts.hoursByDay || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="dayName"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, name) => [
                        `${Number(value).toFixed(1)}h`,
                        name === 'tonnage' ? 'Tonnage' : 'Day Labour'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="tonnage" stackId="a" fill="#3b82f6" name="Tonnage" />
                    <Bar dataKey="dayLabour" stackId="a" fill="#10b981" name="Day Labour" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Companies */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-amber-100 dark:border-amber-900/30">
            <CardTitle className="flex items-center space-x-2 text-amber-800 dark:text-amber-200">
              <Building2 className="h-5 w-5" />
              <span>Top Builders</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                {(dashboardData?.charts.topCompanies || []).slice(0, 5).map((company, index) => (
                  <div key={company.companyCode} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{company.companyName}</p>
                        <p className="text-xs text-muted-foreground">{company.companyCode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{company.totalHours.toFixed(1)}h</p>
                    </div>
                  </div>
                ))}
                {(!dashboardData?.charts.topCompanies || dashboardData.charts.topCompanies.length === 0) && (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    No company data available
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2.5: Top Contractors Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Top Contractors (This Week)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData?.charts.topContractors || []} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="nickname"
                    tick={{ fontSize: 11 }}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'totalHours' ? `${Number(value).toFixed(1)} hours` : formatCurrency(Number(value)),
                      name === 'totalHours' ? 'Total Hours' : 'Est. Payout'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="totalHours" fill="#3b82f6" name="Hours" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Row 3: Tables */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Invoices */}
        <Card className="lg:col-span-2 border-t-4 border-t-red-500">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Receipt className="h-5 w-5 text-red-600" />
                <span>Pending Invoices</span>
                <Badge variant="destructive" className="text-xs">
                  {(dashboardData?.tables.pendingInvoices || []).length} Pending
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Invoices requiring your attention
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/admin/weekly-payments")}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {(dashboardData?.tables.pendingInvoices || []).length > 0 ? (
                  dashboardData.tables.pendingInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium truncate">{invoice.contractorNickname}</p>
                          <Badge variant="outline" className="text-xs">
                            {invoice.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{invoice.weekLabel}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(invoice.totalAmount)}</p>
                        <p className="text-xs text-muted-foreground">{invoice.totalHours.toFixed(1)}h</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    No pending invoices
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Sidebar */}
        <Card className="border-t-4 border-t-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push("/dashboard/dockets")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Manage Dockets
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push("/dashboard/contractors")}
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Contractors
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push("/dashboard/admin/weekly-payments")}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Process Payments
            </Button>
            <div className="pt-3 border-t">
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">System Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Active Sites:</span>
                  <Badge variant="secondary">
                    {dashboardData?.charts.topCompanies?.length || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Total Workers:</span>
                  <Badge variant="secondary">
                    {dashboardData?.kpis.uniqueContractors || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>This Week:</span>
                  <Badge variant="secondary">
                    {(dashboardData?.kpis.totalHours.combined || 0).toFixed(0)}h
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Recent Dockets */}
      <Card className="shadow-lg border-t-4 border-t-emerald-500">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-t-lg flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-emerald-600" />
              <span>Recent Site Activities</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Latest docket submissions and site updates
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/dockets")}
          >
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {(dashboardData?.recentDockets || []).length > 0 ? (
                <div className="space-y-2">
                  {dashboardData.recentDockets.map((docket) => (
                    <div key={docket.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="text-center min-w-[60px]">
                          <p className="text-sm font-medium">{docket.date}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{docket.companyCode}</p>
                          <p className="text-xs text-muted-foreground truncate">{docket.builderName}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground truncate">{docket.locationLabel}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center min-w-[50px]">
                          <p className="text-sm font-semibold">{docket.contractorCount}</p>
                          <p className="text-xs text-muted-foreground">Workers</p>
                        </div>
                        <div className="text-center min-w-[50px]">
                          <p className="text-sm font-semibold">{docket.totalHours.toFixed(1)}h</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                        <div className="text-center min-w-[40px]">
                          <div className="flex items-center justify-center space-x-1">
                            <Camera className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-semibold">{docket.mediaCount}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Media</p>
                        </div>
                        <div className="flex items-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/dashboard/dockets/${docket.id}`)}
                            className="h-8 px-2"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-muted-foreground">
                  No recent dockets found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    )
  }

  // Fallback for users without proper roles or unauthenticated
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-4">
          You don&apos;t have permission to access this dashboard.
        </p>
        <Button onClick={() => router.push('/auth/login')}>
          Sign In
        </Button>
      </div>
    </div>
  )
}
