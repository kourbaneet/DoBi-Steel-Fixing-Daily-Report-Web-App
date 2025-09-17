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
  Building,
  MapPin,
  User,
  Wrench
} from "lucide-react"
import { toast } from "sonner"

interface DocketHistoryItem {
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

interface DocketsResponse {
  success: boolean
  message: string
  data: {
    dockets: DocketHistoryItem[]
    totals: {
      totalHours: number
      totalTonnageHours: number
      totalDayLabourHours: number
      totalEntries: number
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
  builders: { id: string; name: string; companyCode: string }[]
  locations: { id: string; label: string; builderId: string }[]
  supervisors: { id: string; name: string }[]
  contractors: { id: string; nickname: string; fullName?: string }[]
}

export default function DocketsHistoryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [dockets, setDockets] = useState<DocketHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totals, setTotals] = useState<any>(null)

  // Filters
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || "")
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || "")
  const [selectedBuilder, setSelectedBuilder] = useState<string | undefined>(searchParams.get('builderId') || undefined)
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(searchParams.get('locationId') || undefined)
  const [selectedSupervisor, setSelectedSupervisor] = useState<string | undefined>(searchParams.get('supervisorId') || undefined)
  const [selectedContractor, setSelectedContractor] = useState<string | undefined>(searchParams.get('contractorId') || undefined)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || "")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery)

  // Filter options
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    builders: [],
    locations: [],
    supervisors: [],
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
    fetchDockets()
  }, [dateFrom, dateTo, selectedBuilder, selectedLocation, selectedSupervisor, selectedContractor, debouncedSearchQuery, page])

  const fetchFilterOptions = async () => {
    try {
      // Fetch builders
      const buildersResponse = await fetch('/api/builders')
      if (buildersResponse.ok) {
        const buildersData = await buildersResponse.json()
        setFilterOptions(prev => ({ ...prev, builders: buildersData.data || [] }))
      }

      // Fetch contractors
      const contractorsResponse = await fetch('/api/contractors')
      if (contractorsResponse.ok) {
        const contractorsData = await contractorsResponse.json()
        setFilterOptions(prev => ({ ...prev, contractors: contractorsData.data || [] }))
      }

      // Fetch supervisors and locations would require separate endpoints
      // For now, they'll be populated as we encounter them in the data

    } catch (err) {
      console.error('Error fetching filter options:', err)
    }
  }

  const fetchDockets = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      if (selectedBuilder) params.set('builderId', selectedBuilder)
      if (selectedLocation) params.set('locationId', selectedLocation)
      if (selectedSupervisor) params.set('supervisorId', selectedSupervisor)
      if (selectedContractor) params.set('contractorId', selectedContractor)
      if (debouncedSearchQuery) params.set('q', debouncedSearchQuery)
      params.set('page', page.toString())
      params.set('limit', '50')

      const response = await fetch(`/api/history/dockets?${params.toString()}`, {
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
        throw new Error('Failed to fetch dockets history')
      }

      const data: DocketsResponse = await response.json()

      // Validate response structure and ensure we always have an array for dockets
      if (data && data.success) {
        setDockets(Array.isArray(data.data?.dockets) ? data.data.dockets : [])
        setTotals(data.data?.totals || null)
        setTotalPages(data.meta?.totalPages || 1)
      } else {
        console.warn('API response indicates failure:', data.message || 'Unknown error')
        setDockets([])
        setTotals(null)
        setTotalPages(1)
      }

    } catch (err) {
      console.error('Error fetching dockets history:', err)
      setError('Failed to load dockets history')
      toast.error('Failed to load dockets history')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      if (selectedBuilder) params.set('builderId', selectedBuilder)
      if (selectedLocation) params.set('locationId', selectedLocation)
      if (selectedSupervisor) params.set('supervisorId', selectedSupervisor)
      if (selectedContractor) params.set('contractorId', selectedContractor)
      if (debouncedSearchQuery) params.set('q', debouncedSearchQuery)
      params.set('format', 'csv')

      const response = await fetch(`/api/history/dockets/export?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to export dockets history')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `dockets-history-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Dockets history exported successfully!')

    } catch (err) {
      console.error('Error exporting dockets history:', err)
      toast.error('Failed to export dockets history')
    }
  }

  const clearFilters = () => {
    setDateFrom("")
    setDateTo("")
    setSelectedBuilder(undefined)
    setSelectedLocation(undefined)
    setSelectedSupervisor(undefined)
    setSelectedContractor(undefined)
    setSearchQuery("")
    setPage(1)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dockets History</h1>
            <p className="text-muted-foreground mt-2">
              View and export historical docket entries
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
            <h2 className="text-xl font-semibold mb-2">Unable to load dockets history</h2>
            <p className="text-muted-foreground mb-4 text-center">{error}</p>
            <Button onClick={fetchDockets} variant="outline">
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
          <h1 className="text-3xl font-bold">Dockets History</h1>
          <p className="text-muted-foreground mt-2">
            View and export historical docket entries
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
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{totals.totalEntries}</p>
                <p className="text-xs text-muted-foreground">Total Entries</p>
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
              <Wrench className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{totals.totalTonnageHours.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Tonnage Hours</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <User className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{totals.totalDayLabourHours.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Day Labour Hours</p>
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
              <Label htmlFor="builder">Builder</Label>
              <Select value={selectedBuilder} onValueChange={setSelectedBuilder}>
                <SelectTrigger>
                  <SelectValue placeholder="All Builders" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.builders.map((builder) => (
                    <SelectItem key={builder.id} value={builder.id}>
                      {builder.name} ({builder.companyCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>
          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search contractors, builders, locations..."
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

      {/* Dockets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Docket Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {dockets.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No dockets found</h3>
              <p className="text-muted-foreground">
                No docket entries match your current filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Builder</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Supervisor</TableHead>
                    <TableHead>Contractor</TableHead>
                    <TableHead className="text-right">Tonnage</TableHead>
                    <TableHead className="text-right">Day Labour</TableHead>
                    <TableHead className="text-right">Total Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dockets.map((docket) => (
                    <TableRow key={docket.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{docket.date}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{docket.builderName}</div>
                          <div className="text-xs text-muted-foreground">
                            {docket.builderCompanyCode}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>{docket.locationLabel}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span>{docket.supervisorName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{docket.contractorNickname}</div>
                          {docket.contractorFullName && (
                            <div className="text-xs text-muted-foreground">
                              {docket.contractorFullName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {docket.tonnageHours.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {docket.dayLabourHours.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {docket.totalHours.toFixed(2)}
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