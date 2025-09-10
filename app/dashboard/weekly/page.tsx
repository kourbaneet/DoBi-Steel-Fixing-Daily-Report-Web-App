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
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Weekly Timesheets</h1>
          <p className="text-muted-foreground">
            View aggregated contractor hours for Monday through Saturday
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter weekly timesheets by week, builder, location, or contractor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                <Calendar className="h-4 w-4 inline mr-1" />
                Week
              </label>
              <Input
                type="text"
                placeholder="2025-W36"
                value={week}
                onChange={(e) => setWeek(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Builder</label>
              <Select value={selectedBuilderId} onValueChange={setSelectedBuilderId}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedBuilderId ? builders.find(b => b.id === selectedBuilderId)?.name : "All builders"} />
                </SelectTrigger>
                <SelectContent>
                  {builders.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No builders available
                    </div>
                  ) : (
                    builders.map((builder) => (
                      <SelectItem key={builder.id} value={builder.id}>
                        <div className="flex items-center">
                          <span>{builder.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {builder.companyCode}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Select 
                value={selectedLocationId} 
                onValueChange={setSelectedLocationId}
                disabled={!selectedBuilderId || selectedBuilderId === "all"}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedLocationId ? locations.find(l => l.id === selectedLocationId)?.label : "All locations"} />
                </SelectTrigger>
                <SelectContent>
                  {!selectedBuilderId ? (
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
                        {location.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Search Contractor</label>
              <Input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} disabled={loading} className="flex-1">
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search
              </Button>
              <Button onClick={resetFilters} variant="outline" size="sm">
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Data */}
      {weeklyData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Week of {weeklyData.weekStart} to {weeklyData.weekEnd}
            </CardTitle>
            <CardDescription>
              {weeklyData.rows.length} contractor{weeklyData.rows.length !== 1 ? 's' : ''} • 
              {weeklyData.totals.hours} total hours • 
              ${weeklyData.totals.amount} total amount
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Contractor</TableHead>
                    <TableHead className="min-w-[120px]">Builder</TableHead>
                    <TableHead className="min-w-[120px]">Location</TableHead>
                    <TableHead className="text-center">Mon</TableHead>
                    <TableHead className="text-center">Tue</TableHead>
                    <TableHead className="text-center">Wed</TableHead>
                    <TableHead className="text-center">Thu</TableHead>
                    <TableHead className="text-center">Fri</TableHead>
                    <TableHead className="text-center">Sat</TableHead>
                    <TableHead className="text-center">Tonnage</TableHead>
                    <TableHead className="text-center">Day Labour</TableHead>
                    <TableHead className="text-center">Total Hrs</TableHead>
                    <TableHead className="text-center">Rate</TableHead>
                    <TableHead className="text-center">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklyData.rows.map((row) => (
                    <TableRow key={`${row.contractorId}-${row.builderId}-${row.locationId}`}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{getContractorDisplayName(row)}</div>
                          <div className="text-xs text-muted-foreground">
                            {row.nickname}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{row.builderName}</div>
                          <div className="text-xs text-muted-foreground">
                            {row.companyCode}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{row.locationLabel}</TableCell>
                      <TableCell className="text-center">{row.mon}</TableCell>
                      <TableCell className="text-center">{row.tue}</TableCell>
                      <TableCell className="text-center">{row.wed}</TableCell>
                      <TableCell className="text-center">{row.thu}</TableCell>
                      <TableCell className="text-center">{row.fri}</TableCell>
                      <TableCell className="text-center">{row.sat}</TableCell>
                      <TableCell className="text-center">{row.tonnageHours}</TableCell>
                      <TableCell className="text-center">{row.dayLabourHours}</TableCell>
                      <TableCell className="text-center font-semibold">{row.totalHours}</TableCell>
                      <TableCell className="text-center">${row.rate}</TableCell>
                      <TableCell className="text-center font-semibold">${row.totalAmount}</TableCell>
                    </TableRow>
                  ))}
                  {weeklyData.rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                        No timesheet data found for the selected criteria
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            {weeklyData.rows.length > 0 && (
              <div className="mt-6 flex justify-end">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-right">
                      <span className="font-medium">Total Hours:</span>
                    </div>
                    <div className="font-bold">{weeklyData.totals.hours}</div>
                    <div className="text-right">
                      <span className="font-medium">Total Amount:</span>
                    </div>
                    <div className="font-bold text-lg">${weeklyData.totals.amount}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading weekly timesheet data...
          </CardContent>
        </Card>
      )}
    </div>
  )
}