"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Download, Calendar, Filter, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { WeeklyRow, WeeklyPayload } from "@/modules/weekly/types"
import { getCurrentWeekString } from "@/modules/weekly/helpers"

interface Builder {
  id: string
  name: string
  companyCode: string
}

interface Location {
  id: string
  label: string
}

export default function WeeklyTimesheetsPage() {
  const [loading, setLoading] = useState(false)
  const [weeklyData, setWeeklyData] = useState<WeeklyPayload | null>(null)
  const [builders, setBuilders] = useState<Builder[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  
  // Filters
  const [week, setWeek] = useState(getCurrentWeekString())
  const [selectedBuilderId, setSelectedBuilderId] = useState("all")
  const [selectedLocationId, setSelectedLocationId] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchBuilders()
    fetchWeeklyData()
  }, [])

  useEffect(() => {
    if (selectedBuilderId && selectedBuilderId !== "all") {
      fetchLocations(selectedBuilderId)
    } else {
      setLocations([])
      setSelectedLocationId("all")
    }
  }, [selectedBuilderId])

  const fetchBuilders = async () => {
    try {
      const response = await fetch("/api/admin/builders?limit=100")
      if (response.ok) {
        const result = await response.json()
        setBuilders(result.data || [])
      }
    } catch (error) {
      console.error("Error fetching builders:", error)
      setBuilders([])
    }
  }

  const fetchLocations = async (builderId: string) => {
    try {
      const response = await fetch(`/api/admin/builders/${builderId}/locations?limit=100`)
      if (response.ok) {
        const result = await response.json()
        setLocations(result.data || [])
      }
    } catch (error) {
      console.error("Error fetching locations:", error)
      setLocations([])
    }
  }

  const fetchWeeklyData = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (week) params.set('week', week)
      if (selectedBuilderId && selectedBuilderId !== "all") params.set('builderId', selectedBuilderId)
      if (selectedLocationId && selectedLocationId !== "all") params.set('locationId', selectedLocationId)
      if (searchQuery) params.set('q', searchQuery)

      const response = await fetch(`/api/weekly?${params.toString()}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch weekly data')
      }

      const result = await response.json()
      setWeeklyData(result.data)
    } catch (error) {
      console.error("Error fetching weekly data:", error)
      toast.error(error instanceof Error ? error.message : "Failed to fetch weekly data")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchWeeklyData()
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (week) params.set('week', week)
      if (selectedBuilderId && selectedBuilderId !== "all") params.set('builderId', selectedBuilderId)
      if (selectedLocationId && selectedLocationId !== "all") params.set('locationId', selectedLocationId)
      if (searchQuery) params.set('q', searchQuery)
      params.set('format', 'csv')

      const response = await fetch(`/api/weekly/export?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to export weekly data')
      }

      // Create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `weekly-timesheets-${week || 'current'}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success("Weekly timesheet exported successfully")
    } catch (error) {
      console.error("Error exporting weekly data:", error)
      toast.error("Failed to export weekly data")
    }
  }

  const resetFilters = () => {
    setWeek(getCurrentWeekString())
    setSelectedBuilderId("all")
    setSelectedLocationId("all")
    setSearchQuery("")
  }

  const getContractorDisplayName = (row: WeeklyRow) => {
    return row.fullName || `${row.firstName || ''} ${row.lastName || ''}`.trim() || row.nickname
  }

  return (
    <div className="flex-1 space-y-4 p-3 sm:p-4 md:p-6 lg:p-8 pt-4 sm:pt-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Weekly Timesheets</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            View aggregated contractor hours for Monday through Saturday
          </p>
        </div>
        <div className="flex-shrink-0">
          <Button onClick={handleExport} variant="outline" size="sm" className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            <span className="sm:inline">Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Filters
          </CardTitle>
          <CardDescription className="text-sm">
            Filter weekly timesheets by week, builder, location, or contractor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            <div className="sm:col-span-1">
              <label className="text-sm font-medium mb-2 block">
                <Calendar className="h-4 w-4 inline mr-1" />
                Week
              </label>
              <Input
                type="text"
                placeholder="2025-W36"
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="text-sm font-medium mb-2 block">Builder</label>
              <Select value={selectedBuilderId} onValueChange={setSelectedBuilderId}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="All builders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All builders</SelectItem>
                  {builders.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No builders available
                    </div>
                  ) : (
                    builders.map((builder) => (
                      <SelectItem key={builder.id} value={builder.id}>
                        <div className="flex items-center">
                          <span className="truncate">{builder.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs hidden sm:inline-flex">
                            {builder.companyCode}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-1">
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Select
                value={selectedLocationId}
                onValueChange={setSelectedLocationId}
                disabled={!selectedBuilderId || selectedBuilderId === "all"}
              >
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {!selectedBuilderId || selectedBuilderId === "all" ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Select a builder first
                    </div>
                  ) : locations.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No locations available
                    </div>
                  ) : (
                    locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        <span className="truncate">{location.label}</span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-1">
              <label className="text-sm font-medium mb-2 block">Search Contractor</label>
              <Input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1 flex flex-col sm:items-end sm:justify-end gap-2">
              <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:gap-2 sm:w-auto">
                <Button onClick={handleSearch} disabled={loading} size="sm" className="text-sm">
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  <span className="hidden sm:inline">Search</span>
                  <span className="sm:hidden">Search</span>
                </Button>
                <Button onClick={resetFilters} variant="outline" size="sm" className="text-sm">
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Data */}
      {weeklyData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              <span className="hidden sm:inline">Week of {weeklyData.weekStart} to {weeklyData.weekEnd}</span>
              <span className="sm:hidden">{weeklyData.weekStart} - {weeklyData.weekEnd}</span>
            </CardTitle>
            <CardDescription className="text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span>{weeklyData.rows.length} contractor{weeklyData.rows.length !== 1 ? 's' : ''}</span>
                <span className="hidden sm:inline">•</span>
                <span>{weeklyData.totals.hours} total hours</span>
                <span className="hidden sm:inline">•</span>
                <span className="font-semibold">${weeklyData.totals.amount} total amount</span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px] sticky left-0 bg-background">Contractor</TableHead>
                    <TableHead className="min-w-[100px]">Builder</TableHead>
                    <TableHead className="min-w-[100px]">Location</TableHead>
                    <TableHead className="text-center w-[60px]">Mon</TableHead>
                    <TableHead className="text-center w-[60px]">Tue</TableHead>
                    <TableHead className="text-center w-[60px]">Wed</TableHead>
                    <TableHead className="text-center w-[60px]">Thu</TableHead>
                    <TableHead className="text-center w-[60px]">Fri</TableHead>
                    <TableHead className="text-center w-[60px]">Sat</TableHead>
                    <TableHead className="text-center w-[80px]">Tonnage</TableHead>
                    <TableHead className="text-center w-[80px]">Day Labour</TableHead>
                    <TableHead className="text-center w-[80px]">Total Hrs</TableHead>
                    <TableHead className="text-center w-[70px]">Rate</TableHead>
                    <TableHead className="text-center w-[90px]">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklyData.rows.map((row) => (
                    <TableRow key={`${row.contractorId}-${row.builderId}-${row.locationId}`}>
                      <TableCell className="font-medium sticky left-0 bg-background min-w-0">
                        <div className="min-w-0">
                          <div className="text-sm truncate">{getContractorDisplayName(row)}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {row.nickname}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-0">
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{row.builderName}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {row.companyCode}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-0">
                        <span className="text-sm truncate">{row.locationLabel}</span>
                      </TableCell>
                      <TableCell className="text-center text-sm">{row.mon || '0'}</TableCell>
                      <TableCell className="text-center text-sm">{row.tue || '0'}</TableCell>
                      <TableCell className="text-center text-sm">{row.wed || '0'}</TableCell>
                      <TableCell className="text-center text-sm">{row.thu || '0'}</TableCell>
                      <TableCell className="text-center text-sm">{row.fri || '0'}</TableCell>
                      <TableCell className="text-center text-sm">{row.sat || '0'}</TableCell>
                      <TableCell className="text-center text-sm">{row.tonnageHours}</TableCell>
                      <TableCell className="text-center text-sm">{row.dayLabourHours}</TableCell>
                      <TableCell className="text-center font-semibold text-sm">{row.totalHours}</TableCell>
                      <TableCell className="text-center text-sm">${row.rate}</TableCell>
                      <TableCell className="text-center font-semibold text-sm">${row.totalAmount}</TableCell>
                    </TableRow>
                  ))}
                  {weeklyData.rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={14} className="text-center py-8 text-muted-foreground text-sm">
                        No timesheet data found for the selected criteria
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            {weeklyData.rows.length > 0 && (
              <div className="mt-4 sm:mt-6 flex justify-center sm:justify-end">
                <div className="bg-muted/50 p-3 sm:p-4 rounded-lg w-full max-w-xs sm:max-w-none sm:w-auto">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                    <div className="text-right">
                      <span className="font-medium">Total Hours:</span>
                    </div>
                    <div className="font-bold">{weeklyData.totals.hours}</div>
                    <div className="text-right">
                      <span className="font-medium">Total Amount:</span>
                    </div>
                    <div className="font-bold text-base sm:text-lg">${weeklyData.totals.amount}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-6 sm:py-8 px-4">
            <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6 animate-spin mr-2" />
            <span className="text-sm sm:text-base">Loading weekly timesheet data...</span>
          </CardContent>
        </Card>
      )}
    </div>
  )
}