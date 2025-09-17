"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  FileText,
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Building,
  MapPin,
  Users,
  Clock,
} from "lucide-react"
import { CreateDocketModal } from "@/components/docket/create-docket-modal"
import { EditDocketModal } from "@/components/docket/edit-docket-modal"
import { DeleteDocketModal } from "@/components/docket/delete-docket-modal"
import { PermissionWrapper } from "@/components/PermissionWrapper"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { toast } from "sonner"
import { DocketListItem } from "@/modules/docket/types"

interface DocketsPageData {
  dockets: DocketListItem[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
}

export default function DocketsPage() {
  const router = useRouter()
  const [data, setData] = useState<DocketsPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState("desc")
  const [builderId, setBuilderId] = useState<string>("")
  const [locationId, setLocationId] = useState<string>("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedDocket, setSelectedDocket] = useState<DocketListItem | null>(null)

  const fetchDockets = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
        ...(builderId && { builderId }),
        ...(locationId && { locationId }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      })

      const response = await fetch(`/api/dockets?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch dockets")
      }

      const result = await response.json()
      
      // Transform API response to expected format
      const transformedData: DocketsPageData = {
        dockets: result.data || [],
        totalCount: result.meta?.total || 0,
        page: result.meta?.page || 1,
        limit: result.meta?.limit || 10,
        totalPages: result.meta?.totalPages || 1
      }
      
      setData(transformedData)
    } catch (error) {
      console.error("Error fetching dockets:", error)
      toast.error("Failed to fetch dockets")
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, sortBy, sortOrder, builderId, locationId, startDate, endDate])

  useEffect(() => {
    fetchDockets()
  }, [fetchDockets])

  useEffect(() => {
    setCurrentPage(1)
  }, [pageSize, sortBy, sortOrder, builderId, locationId, startDate, endDate])

  const handleCreateSuccess = () => {
    setCreateModalOpen(false)
    fetchDockets()
    toast.success("Docket created successfully")
  }

  const handleEditSuccess = () => {
    setEditModalOpen(false)
    setSelectedDocket(null)
    fetchDockets()
    toast.success("Docket updated successfully")
  }

  const handleDeleteSuccess = () => {
    setDeleteModalOpen(false)
    setSelectedDocket(null)
    fetchDockets()
    toast.success("Docket deleted successfully")
  }

  const handleViewDetails = (docket: DocketListItem) => {
    router.push(`/dashboard/dockets/${docket.id}`)
  }

  const handleEdit = (docket: DocketListItem) => {
    setSelectedDocket(docket)
    setEditModalOpen(true)
  }

 

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const handleDelete = (docket: DocketListItem) => {
    setSelectedDocket(docket)
    setDeleteModalOpen(true)
  }

  const clearFilters = () => {
    setBuilderId("")
    setLocationId("")
    setStartDate("")
    setEndDate("")
  }

  const renderPagination = () => {
    if (!data) return null

    const { page, totalPages } = data
    const pages = []

    // Show fewer pages on mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
    const pageRange = isMobile ? 1 : 2

    for (let i = Math.max(1, page - pageRange); i <= Math.min(totalPages, page + pageRange); i++) {
      pages.push(i)
    }

    return (
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
          <span className="hidden sm:inline">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, data.totalCount)} of {data.totalCount} dockets
          </span>
          <span className="sm:hidden">
            {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, data.totalCount)} of {data.totalCount}
          </span>
        </div>
        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="text-xs sm:text-sm px-2 sm:px-3"
          >
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </Button>

          {/* Show first page if not in range */}
          {pages[0] > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                1
              </Button>
              {pages[0] > 2 && <span className="text-xs text-muted-foreground">...</span>}
            </>
          )}

          {pages.map((pageNum) => (
            <Button
              key={pageNum}
              variant={pageNum === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(pageNum)}
              className="text-xs sm:text-sm px-2 sm:px-3 min-w-[32px] sm:min-w-[36px]"
            >
              {pageNum}
            </Button>
          ))}

          {/* Show last page if not in range */}
          {pages[pages.length - 1] < totalPages && (
            <>
              {pages[pages.length - 1] < totalPages - 1 && <span className="text-xs text-muted-foreground">...</span>}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                {totalPages}
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="text-xs sm:text-sm px-2 sm:px-3"
          >
            <span className="hidden sm:inline">Next</span>
            <span className="sm:hidden">Next</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute permission="dockets.view">
      <div className="flex-1 space-y-4 p-3 sm:p-4 md:p-6 lg:p-8 pt-4 sm:pt-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Daily Dockets</h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage daily work reports and time tracking
            </p>
          </div>
          <div className="flex-shrink-0">
            <PermissionWrapper permission="dockets.create">
              <Button onClick={() => setCreateModalOpen(true)} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                <span className="sm:inline">Create Docket</span>
              </Button>
            </PermissionWrapper>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <CardTitle className="text-lg sm:text-xl">Filters</CardTitle>
              <Button variant="outline" onClick={clearFilters} size="sm" className="w-full sm:w-auto">
                Clear Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Builder</label>
                <Input
                  placeholder="Builder ID"
                  value={builderId}
                  onChange={(e) => setBuilderId(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Location</label>
                <Input
                  placeholder="Location ID"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <CardTitle className="text-lg sm:text-xl">All Dockets</CardTitle>
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:space-x-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="createdAt">Created</SelectItem>
                      <SelectItem value="updatedAt">Updated</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-full sm:w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Asc</SelectItem>
                      <SelectItem value="desc">Desc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                  <SelectTrigger className="w-full sm:w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : data && data.dockets.length > 0 ? (
              <>
                <div className="overflow-x-auto -mx-3 sm:mx-0">
                  <div className="min-w-[700px] px-3 sm:px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Date</TableHead>
                        <TableHead className="min-w-[140px]">Builder</TableHead>
                        <TableHead className="min-w-[120px] hidden md:table-cell">Location</TableHead>
                        <TableHead className="min-w-[120px] hidden lg:table-cell">Supervisor</TableHead>
                        <TableHead className="min-w-[80px] text-center">Entries</TableHead>
                        <TableHead className="min-w-[80px] text-center hidden sm:table-cell">Media</TableHead>
                        <TableHead className="min-w-[80px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.dockets.map((docket) => (
                        <TableRow key={docket.id}>
                          <TableCell className="min-w-0 pr-2">
                            <div className="flex items-center space-x-2">
                              <Calendar className="hidden sm:block h-4 w-4 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm truncate">{formatDate(docket.date)}</div>
                                {docket.scheduleNo && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {docket.scheduleNo}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-0 pr-2">
                            <div className="flex items-center space-x-2">
                              <Building className="hidden sm:block h-4 w-4 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm truncate">{docket.builder.name}</div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {docket.builder.companyCode}
                                  </Badge>
                                  <div className="md:hidden text-xs text-muted-foreground truncate">
                                    {docket.location.label}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-0 pr-2 hidden md:table-cell">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span className="text-sm truncate">{docket.location.label}</span>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-0 pr-2 hidden lg:table-cell">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 flex-shrink-0" />
                              <span className="text-sm truncate">{docket.supervisor.name || 'Unknown'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center pr-2">
                            <div className="flex flex-col space-y-1">
                              <Badge variant="secondary" className="text-xs">{docket._count.entries}</Badge>
                              <div className="sm:hidden">
                                <Badge variant="outline" className="text-xs">{docket._count.media}</Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center pr-2 hidden sm:table-cell">
                            <Badge variant="outline" className="text-xs">{docket._count.media}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 touch-manipulation">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(docket)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  <span className="hidden sm:inline">View Details</span>
                                  <span className="sm:hidden">View</span>
                                </DropdownMenuItem>
                                <PermissionWrapper permission="dockets.edit">
                                  <DropdownMenuItem onClick={() => handleEdit(docket)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                </PermissionWrapper>
                                <PermissionWrapper permission="dockets.delete">
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(docket)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </PermissionWrapper>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </div>
                
                <div className="mt-4">
                  {renderPagination()}
                </div>
              </>
            ) : (
              <div className="text-center py-8 px-4">
                <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                <h3 className="mt-2 text-sm sm:text-base font-semibold text-gray-900">No dockets</h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
                  Get started by creating a new daily docket.
                </p>
                <div className="mt-4 sm:mt-6">
                  <PermissionWrapper permission="dockets.create">
                    <Button onClick={() => setCreateModalOpen(true)} className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Docket
                    </Button>
                  </PermissionWrapper>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        <CreateDocketModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />

        {selectedDocket && (
          <EditDocketModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false)
              setSelectedDocket(null)
            }}
            onSuccess={handleEditSuccess}
            docket={selectedDocket}
          />
        )}

        {selectedDocket && (
          <DeleteDocketModal
            open={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false)
              setSelectedDocket(null)
            }}
            onSuccess={handleDeleteSuccess}
            docket={selectedDocket}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}