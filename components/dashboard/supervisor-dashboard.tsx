"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  Users,
  Clock,
  AlertTriangle,
  Camera,
  Plus,
  FileEdit,
  Building2,
  MapPin,
  Calendar,
  Filter,
  ArrowUpRight,
  BarChart3,
  PieChart,
  TrendingUp,
  Hammer,
  Truck,
  Eye,
  Edit,
  RefreshCw,
  History,
  Download,
  Search,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
} from "recharts"

interface SupervisorDashboardData {
  kpis: {
    myDockets: number
    workersAdded: number
    totalHours: {
      dayLabour: number
      tonnage: number
      combined: number
    }
    pendingSignature: number
    mediaUploaded: number
  }
  charts: {
    hoursBySite: Array<{
      locationId: string
      locationLabel: string
      totalHours: number
    }>
    workTypeComposition: {
      dayLabour: number
      tonnage: number
    }
    topWorkers: Array<{
      contractorId: string
      nickname: string
      totalHours: number
    }>
  }
}

interface Builder {
  id: string
  name: string
  companyCode: string
  locations: {
    id: string
    label: string
  }[]
}

interface Location {
  id: string
  label: string
}

interface DocketEntry {
  id: string
  date: string
  builder: {
    companyCode: string
    name: string
  }
  location: {
    label: string
  }
  workerCount: number
  totalHours: {
    dayLabour: number
    tonnage: number
    combined: number
  }
  mediaCount: number
  hasSignature: boolean
  status: 'draft' | 'submitted' | 'signed'
}

interface SiteOperation {
  locationId: string
  locationLabel: string
  builderId: string
  builderCode: string
  builderName: string
  status: 'not-started' | 'in-progress' | 'completed' | 'needs-attention'
  workersOnSite: number
  currentHours: {
    dayLabour: number
    tonnage: number
    combined: number
  }
  mediaCount: number
  lastUpdate: Date | null
  docketId: string | null
  alerts: string[]
}

interface SiteOperationsData {
  activeSites: SiteOperation[]
  summary: {
    totalActiveSites: number
    totalWorkers: number
    sitesWithIssues: number
  }
}


export function SupervisorDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<SupervisorDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [builders, setBuilders] = useState<Builder[]>([])
  const [dockets, setDockets] = useState<DocketEntry[]>([])
  const [siteOperations, setSiteOperations] = useState<SiteOperationsData | null>(null)
  const [loadingTables, setLoadingTables] = useState(true)

  // Filter states
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'quarter' | 'halfyear' | 'year'>('month')
  const [selectedBuilder, setSelectedBuilder] = useState<string>('all')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')

  // Date range labels
  const dateRangeLabels = {
    today: { label: 'today', possessive: "Today's" },
    week: { label: 'this week', possessive: "This week's" },
    month: { label: 'this month', possessive: "This month's" },
    quarter: { label: 'this quarter', possessive: "This quarter's" },
    halfyear: { label: 'half year', possessive: "Half year's" },
    year: { label: 'this year', possessive: "This year's" }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [dateRange, selectedBuilder, selectedLocation])

  useEffect(() => {
    fetchFilters()
  }, [])

  useEffect(() => {
    fetchTableData()
  }, [dateRange, selectedBuilder, selectedLocation])

  const fetchSiteOperations = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        ...(selectedBuilder !== 'all' && { builderId: selectedBuilder }),
        ...(selectedLocation !== 'all' && { locationId: selectedLocation }),
      })

      const response = await fetch(`/api/dashboard/supervisor/site-operations?${params}`)
      if (response.ok) {
        const result = await response.json()
        setSiteOperations(result.data)
      } else {
        // Fallback to mock data for development
        const mockSiteOperations: SiteOperationsData = {
          activeSites: [
            {
              locationId: 'site-a',
              locationLabel: 'Site A',
              builderId: 'builder-abc',
              builderCode: 'ABC',
              builderName: 'ABC Construction',
              status: 'in-progress',
              workersOnSite: 5,
              currentHours: { dayLabour: 8.5, tonnage: 12.0, combined: 20.5 },
              mediaCount: 3,
              lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
              docketId: 'docket-1',
              alerts: []
            },
            {
              locationId: 'site-b',
              locationLabel: 'Site B',
              builderId: 'builder-xyz',
              builderCode: 'XYZ',
              builderName: 'XYZ Builders',
              status: 'in-progress',
              workersOnSite: 3,
              currentHours: { dayLabour: 6.0, tonnage: 8.5, combined: 14.5 },
              mediaCount: 1,
              lastUpdate: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
              docketId: 'docket-2',
              alerts: []
            },
            {
              locationId: 'site-c',
              locationLabel: 'Site C',
              builderId: 'builder-def',
              builderCode: 'DEF',
              builderName: 'DEF Construction',
              status: 'needs-attention',
              workersOnSite: 0,
              currentHours: { dayLabour: 0, tonnage: 0, combined: 0 },
              mediaCount: 0,
              lastUpdate: null,
              docketId: null,
              alerts: ['No activity today']
            }
          ],
          summary: {
            totalActiveSites: 3,
            totalWorkers: 8,
            sitesWithIssues: 1
          }
        }
        setSiteOperations(mockSiteOperations)
      }

    } catch (error) {
      console.error("Error fetching site operations data:", error)
      setSiteOperations({
        activeSites: [],
        summary: { totalActiveSites: 0, totalWorkers: 0, sitesWithIssues: 0 }
      })
    }
  }, [selectedBuilder, selectedLocation])

  useEffect(() => {
    fetchSiteOperations()
  }, [fetchSiteOperations])

  // Reset location when builder changes
  useEffect(() => {
    setSelectedLocation('all')
  }, [selectedBuilder])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        dateRange,
        ...(selectedBuilder !== 'all' && { builderId: selectedBuilder }),
        ...(selectedLocation !== 'all' && { locationId: selectedLocation }),
      })

      console.log('Supervisor Dashboard - Fetching with params:', {
        dateRange,
        selectedBuilder,
        selectedLocation,
        url: `/api/dashboard/supervisor?${params}`
      })

      const response = await fetch(`/api/dashboard/supervisor?${params}`)
      if (!response.ok) throw new Error("Failed to fetch dashboard data")

      const result = await response.json()
      setDashboardData(result.data)
    } catch (error) {
      console.error("Error fetching supervisor dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFilters = async () => {
    try {
      // Fetch builders with their locations
      const buildersRes = await fetch('/api/builders')
      if (buildersRes.ok) {
        const buildersData = await buildersRes.json()
        setBuilders(buildersData.data || [])
      }
    } catch (error) {
      console.error("Error fetching filter options:", error)
    }
  }

  const fetchTableData = async () => {
    try {
      setLoadingTables(true)

      // Fetch real dockets data from API
      const params = new URLSearchParams({
        dateRange: 'today', // For the table, always show today's dockets
        ...(selectedBuilder !== 'all' && { builderId: selectedBuilder }),
        ...(selectedLocation !== 'all' && { locationId: selectedLocation }),
      })

      const response = await fetch(`/api/dashboard/supervisor/dockets?${params}`)
      if (response.ok) {
        const result = await response.json()
        setDockets(result.data || [])
      } else {
        // Fallback to mock data for development
        const mockDockets: DocketEntry[] = [
          {
            id: '1',
            date: new Date().toISOString().split('T')[0],
            builder: { companyCode: 'ABC', name: 'ABC Construction' },
            location: { label: 'Site A' },
            workerCount: 5,
            totalHours: { dayLabour: 8.5, tonnage: 12.0, combined: 20.5 },
            mediaCount: 3,
            hasSignature: true,
            status: 'submitted'
          },
          {
            id: '2',
            date: new Date().toISOString().split('T')[0],
            builder: { companyCode: 'XYZ', name: 'XYZ Builders' },
            location: { label: 'Site B' },
            workerCount: 3,
            totalHours: { dayLabour: 6.0, tonnage: 8.5, combined: 14.5 },
            mediaCount: 1,
            hasSignature: false,
            status: 'submitted'
          }
        ]
        setDockets(mockDockets)
      }

    } catch (error) {
      console.error("Error fetching table data:", error)
      // Fallback to empty data
      setDockets([])
    } finally {
      setLoadingTables(false)
    }
  }


  const handleCardClick = () => {
    const params = new URLSearchParams({
      mine: '1',
      ...(dateRange === 'today' && { date: new Date().toISOString().split('T')[0] }),
      ...(dateRange === 'week' && {
        startDate: getWeekStart().toISOString().split('T')[0],
        endDate: getWeekEnd().toISOString().split('T')[0]
      }),
      ...(dateRange === 'month' && {
        startDate: getMonthStart().toISOString().split('T')[0],
        endDate: getMonthEnd().toISOString().split('T')[0]
      }),
      ...(dateRange === 'quarter' && {
        startDate: getQuarterStart().toISOString().split('T')[0],
        endDate: getQuarterEnd().toISOString().split('T')[0]
      }),
      ...(dateRange === 'halfyear' && {
        startDate: getHalfYearStart().toISOString().split('T')[0],
        endDate: getHalfYearEnd().toISOString().split('T')[0]
      }),
      ...(dateRange === 'year' && {
        startDate: getYearStart().toISOString().split('T')[0],
        endDate: getYearEnd().toISOString().split('T')[0]
      }),
      ...(selectedBuilder !== 'all' && { builderId: selectedBuilder }),
      ...(selectedLocation !== 'all' && { locationId: selectedLocation }),
    })

    router.push(`/dashboard/dockets?${params}`)
  }

  const getWeekStart = () => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Monday start
    return new Date(today.setDate(diff))
  }

  const getWeekEnd = () => {
    const weekStart = getWeekStart()
    return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
  }

  const getMonthStart = () => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  }

  const getMonthEnd = () => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
  }

  const getQuarterStart = () => {
    const today = new Date()
    const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3
    return new Date(today.getFullYear(), quarterStartMonth, 1)
  }

  const getQuarterEnd = () => {
    const today = new Date()
    const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3
    return new Date(today.getFullYear(), quarterStartMonth + 3, 0, 23, 59, 59, 999)
  }

  const getHalfYearStart = () => {
    const today = new Date()
    const halfYearStartMonth = today.getMonth() < 6 ? 0 : 6
    return new Date(today.getFullYear(), halfYearStartMonth, 1)
  }

  const getHalfYearEnd = () => {
    const today = new Date()
    const halfYearStartMonth = today.getMonth() < 6 ? 0 : 6
    return new Date(today.getFullYear(), halfYearStartMonth + 6, 0, 23, 59, 59, 999)
  }

  const getYearStart = () => {
    const today = new Date()
    return new Date(today.getFullYear(), 0, 1)
  }

  const getYearEnd = () => {
    const today = new Date()
    return new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Supervisor Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your sites and track team performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {session?.user?.name || 'Supervisor'}
          </Badge>
        </div>
      </div>

      {/* Global Controls */}
      <Card className="p-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            {/* Date Range */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={dateRange} onValueChange={(value: 'today' | 'week' | 'month' | 'quarter' | 'halfyear' | 'year') => setDateRange(value)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="halfyear">Half Year</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Builder Filter */}
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedBuilder} onValueChange={setSelectedBuilder}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Builders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Builders</SelectItem>
                  {builders.map((builder) => (
                    <SelectItem key={builder.id} value={builder.id}>
                      {builder.companyCode} - {builder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location Filter */}
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {selectedBuilder === 'all'
                    ? builders.flatMap(builder => builder.locations).map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.label}
                        </SelectItem>
                      ))
                    : builders.find(b => b.id === selectedBuilder)?.locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.label}
                        </SelectItem>
                      )) || []
                  }
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <Button onClick={() => router.push('/dashboard/dockets')} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Docket
            </Button>
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
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
            {/* My Dockets */}
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500" onClick={() => handleCardClick()}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">My Dockets</CardTitle>
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.kpis.myDockets || 0}</div>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-muted-foreground">In {dateRangeLabels[dateRange].label}</p>
                  <ArrowUpRight className="h-3 w-3 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            {/* Workers Added */}
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500" onClick={() => handleCardClick()}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">Workers Added</CardTitle>
                <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.kpis.workersAdded || 0}</div>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-muted-foreground">Unique contractors</p>
                  <ArrowUpRight className="h-3 w-3 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            {/* Total Hours */}
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
                    <span className="text-muted-foreground">Day Labour:</span>
                    <span className="font-medium">{(dashboardData?.kpis.totalHours.dayLabour ?? 0).toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tonnage:</span>
                    <span className="font-medium">{(dashboardData?.kpis.totalHours.tonnage ?? 0).toFixed(1)}h</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Signature */}
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-red-500" onClick={() => handleCardClick()}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Pending Signature</CardTitle>
                <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700 dark:text-red-400">{dashboardData?.kpis.pendingSignature || 0}</div>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-muted-foreground">Needs site manager sign</p>
                  <ArrowUpRight className="h-3 w-3 text-red-500" />
                </div>
              </CardContent>
            </Card>

            {/* Media Uploaded */}
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500" onClick={() => handleCardClick()}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Media Uploaded</CardTitle>
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <Camera className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">{dashboardData?.kpis.mediaUploaded || 0}</div>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-muted-foreground">Photos & videos</p>
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Row 2: Field Operations Analytics */}
      <div className="grid gap-6 lg:grid-cols-3 items-stretch">
        {/* A) Site Performance - Modern Card with Custom Bar Display */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden h-full flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Site Performance</h3>
                  <p className="text-blue-100 text-sm">Hours by location</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <MapPin className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="p-6 flex-1">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (dashboardData?.charts.hoursBySite || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <MapPin className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">No Site Data</h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500">No hours recorded for {dateRangeLabels[dateRange].label}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(dashboardData?.charts.hoursBySite || []).map((site, index) => (
                    <div
                      key={site.locationId}
                      className="group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-3 transition-all duration-200"
                      onClick={() => {
                        const params = new URLSearchParams({
                          mine: '1',
                          locationId: site.locationId,
                          ...(dateRange === 'today' && { date: new Date().toISOString().split('T')[0] }),
                          ...(dateRange === 'week' && {
                            startDate: getWeekStart().toISOString().split('T')[0],
                            endDate: getWeekEnd().toISOString().split('T')[0]
                          }),
                          ...(dateRange === 'month' && {
                            startDate: getMonthStart().toISOString().split('T')[0],
                            endDate: getMonthEnd().toISOString().split('T')[0]
                          }),
                          ...(dateRange === 'quarter' && {
                            startDate: getQuarterStart().toISOString().split('T')[0],
                            endDate: getQuarterEnd().toISOString().split('T')[0]
                          }),
                          ...(dateRange === 'halfyear' && {
                            startDate: getHalfYearStart().toISOString().split('T')[0],
                            endDate: getHalfYearEnd().toISOString().split('T')[0]
                          }),
                          ...(dateRange === 'year' && {
                            startDate: getYearStart().toISOString().split('T')[0],
                            endDate: getYearEnd().toISOString().split('T')[0]
                          })
                        })
                        router.push(`/dashboard/dockets?${params}`)
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 text-xs font-bold">
                            {index + 1}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {site.locationLabel}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                          {site.totalHours.toFixed(1)}h
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min((site.totalHours / Math.max(...(dashboardData?.charts.hoursBySite || []).map(s => s.totalHours))) * 100, 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* B) Work Type Split - Circular Progress Style */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden h-full flex flex-col">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Work Distribution</h3>
                  <p className="text-orange-100 text-sm">{dateRangeLabels[dateRange].possessive} composition</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <PieChart className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <Skeleton className="w-32 h-32 rounded-full" />
                </div>
              ) : ((dashboardData?.charts.workTypeComposition.tonnage || 0) + (dashboardData?.charts.workTypeComposition.dayLabour || 0)) === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <PieChart className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">No Work Data</h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500">No work hours recorded for {dateRangeLabels[dateRange].label}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Circular Progress */}
                  <div className="relative w-40 h-40 mx-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={[
                            { name: 'Tonnage', value: dashboardData?.charts.workTypeComposition.tonnage || 0 },
                            { name: 'Day Labour', value: dashboardData?.charts.workTypeComposition.dayLabour || 0 }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          startAngle={90}
                          endAngle={450}
                          dataKey="value"
                        >
                          <Cell fill="#dc2626" />
                          <Cell fill="#f59e0b" />
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {((dashboardData?.charts.workTypeComposition.tonnage || 0) + (dashboardData?.charts.workTypeComposition.dayLabour || 0)).toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Total Hours</div>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Truck className="h-5 w-5 text-red-600 mr-1" />
                        <span className="text-sm font-medium text-red-800 dark:text-red-200">Tonnage</span>
                      </div>
                      <div className="text-xl font-bold text-red-900 dark:text-red-100">
                        {(dashboardData?.charts.workTypeComposition.tonnage || 0).toFixed(1)}h
                      </div>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Hammer className="h-5 w-5 text-amber-600 mr-1" />
                        <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Labour</span>
                      </div>
                      <div className="text-xl font-bold text-amber-900 dark:text-amber-100">
                        {(dashboardData?.charts.workTypeComposition.dayLabour || 0).toFixed(1)}h
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* C) Team Performance - List Style with Avatars */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden h-full flex flex-col">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Top Performers</h3>
                  <p className="text-green-100 text-sm">This period&apos;s leaders</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="p-6 flex-1">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-20 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (dashboardData?.charts.topWorkers || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">No Workers Data</h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500">No workers recorded for {dateRangeLabels[dateRange].label}</p>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '320px' }}>
                  {(dashboardData?.charts.topWorkers || []).slice(0, 8).map((worker, index) => (
                    <div
                      key={worker.contractorId}
                      className="group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-3 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {worker.nickname.substring(0, 2).toUpperCase()}
                          </div>
                          {index < 3 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-yellow-900">
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400">
                            {worker.nickname}
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {worker.totalHours.toFixed(1)} hours
                            </div>
                            <div className="flex items-center">
                              {index < 3 ? (
                                <TrendingUp className="h-3 w-3 text-green-500" />
                              ) : (
                                <div className="w-3 h-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Operational Tables & Tiles */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* D) Today's Dockets */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>{dateRange === 'today' ? "Today's Dockets" : `Dockets in ${dateRangeLabels[dateRange].label}`}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTables ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : dockets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <FileText className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No dockets found for {dateRangeLabels[dateRange].label}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Company</th>
                        <th className="text-left p-2">Location</th>
                        <th className="text-left p-2">Workers</th>
                        <th className="text-left p-2">Hours (Day/Tonn)</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dockets.map((docket) => (
                        <tr key={docket.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-2">{new Date(docket.date).toLocaleDateString()}</td>
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{docket.builder.companyCode}</div>
                              <div className="text-xs text-gray-500">{docket.builder.name}</div>
                            </div>
                          </td>
                          <td className="p-2">{docket.location.label}</td>
                          <td className="p-2">
                            <Badge variant="outline" className="text-xs">
                              {docket.workerCount}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="text-xs">
                              <div>Day: {docket.totalHours.dayLabour.toFixed(1)}h</div>
                              <div>Tonn: {docket.totalHours.tonnage.toFixed(1)}h</div>
                              <div className="font-medium">Total: {docket.totalHours.combined.toFixed(1)}h</div>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/dashboard/dockets?id=${docket.id}&action=edit`)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/dashboard/dockets/${docket.id}`)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Today's Site Operations */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Today&apos;s Site Operations</span>
              </CardTitle>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="default" className="text-xs">
                  {siteOperations?.summary.totalActiveSites || 0} Active Sites
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {siteOperations?.summary.totalWorkers || 0} Workers
                </Badge>
                {(siteOperations?.summary.sitesWithIssues || 0) > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {siteOperations?.summary.sitesWithIssues} Issues
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingTables ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : !siteOperations || siteOperations.activeSites.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <Building2 className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No active sites today</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Sites will appear when dockets are created</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {siteOperations.activeSites.map((site) => {
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case 'in-progress': return { bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800', hover: 'hover:bg-green-100 dark:hover:bg-green-950/50', dot: 'bg-green-500' }
                        case 'completed': return { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', hover: 'hover:bg-blue-100 dark:hover:bg-blue-950/50', dot: 'bg-blue-500' }
                        case 'needs-attention': return { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800', hover: 'hover:bg-orange-100 dark:hover:bg-orange-950/50', dot: 'bg-orange-500' }
                        default: return { bg: 'bg-gray-50 dark:bg-gray-950/30', border: 'border-gray-200 dark:border-gray-800', hover: 'hover:bg-gray-100 dark:hover:bg-gray-950/50', dot: 'bg-gray-500' }
                      }
                    }

                    const getStatusLabel = (status: string) => {
                      switch (status) {
                        case 'in-progress': return 'In Progress'
                        case 'completed': return 'Completed'
                        case 'needs-attention': return 'Needs Attention'
                        case 'not-started': return 'Not Started'
                        default: return 'Unknown'
                      }
                    }

                    const getLastUpdateText = (lastUpdate: Date | null) => {
                      if (!lastUpdate) return 'No updates'
                      const now = new Date()
                      const diffMs = now.getTime() - new Date(lastUpdate).getTime()
                      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

                      if (diffHours > 0) return `${diffHours}h ago`
                      if (diffMinutes > 0) return `${diffMinutes}m ago`
                      return 'Just now'
                    }

                    const colors = getStatusColor(site.status)

                    return (
                      <div
                        key={site.locationId}
                        className={`p-3 ${colors.bg} rounded-lg border ${colors.border} cursor-pointer ${colors.hover} transition-colors`}
                        onClick={() => {
                          const params = new URLSearchParams({
                            locationId: site.locationId,
                            date: new Date().toISOString().split('T')[0],
                            ...(site.builderId && { builderId: site.builderId })
                          })
                          router.push(`/dashboard/dockets?${params}`)
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 ${colors.dot} rounded-full`}></div>
                            <span className="font-medium text-sm">{site.locationLabel} - {site.builderCode}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">{getStatusLabel(site.status)}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3 text-gray-500" />
                            <span>{site.workersOnSite} workers</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span>{site.currentHours.combined.toFixed(1)}h logged</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Camera className="h-3 w-3 text-gray-500" />
                            <span>{site.mediaCount} photos</span>
                          </div>
                          <div className={`${site.status === 'needs-attention' ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-500'}`}>
                            {site.alerts.length > 0 ? site.alerts[0] : `Last update: ${getLastUpdateText(site.lastUpdate)}`}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}