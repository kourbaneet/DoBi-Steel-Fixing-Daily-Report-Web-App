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

  const handleDelete = (docket: DocketListItem) => {
    setSelectedDocket(docket)
    setDeleteModalOpen(true)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
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
    
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
      pages.push(i)
    }

    return (
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, data.totalCount)} of {data.totalCount} dockets
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          
          {pages.map((pageNum) => (
            <Button
              key={pageNum}
              variant={pageNum === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(pageNum)}
            >
              {pageNum}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute permission="dockets.view">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Daily Dockets</h2>
            <p className="text-muted-foreground">
              Manage daily work reports and time tracking
            </p>
          </div>
          <PermissionWrapper permission="dockets.create">
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Docket
            </Button>
          </PermissionWrapper>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filters</CardTitle>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Builder</label>
                <Input
                  placeholder="Builder ID"
                  value={builderId}
                  onChange={(e) => setBuilderId(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Location</label>
                <Input
                  placeholder="Location ID"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Dockets</CardTitle>
              <div className="flex items-center space-x-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="createdAt">Created</SelectItem>
                    <SelectItem value="updatedAt">Updated</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Asc</SelectItem>
                    <SelectItem value="desc">Desc</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                  <SelectTrigger className="w-[100px]">
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Builder</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Supervisor</TableHead>
                      <TableHead>Entries</TableHead>
                      <TableHead>Media</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.dockets.map((docket) => (
                      <TableRow key={docket.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4" />
                            <div>
                              <div className="font-medium">{formatDate(docket.date)}</div>
                              {docket.scheduleNo && (
                                <div className="text-sm text-muted-foreground">
                                  Schedule: {docket.scheduleNo}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Building className="mr-2 h-4 w-4" />
                            <div>
                              <div className="font-medium">{docket.builder.name}</div>
                              <Badge variant="outline" className="text-xs">
                                {docket.builder.companyCode}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MapPin className="mr-2 h-4 w-4" />
                            {docket.location.label}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="mr-2 h-4 w-4" />
                            {docket.supervisor.name || 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{docket._count.entries}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{docket._count.media}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(docket)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
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
                
                <div className="mt-4">
                  {renderPagination()}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No dockets</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new daily docket.
                </p>
                <div className="mt-6">
                  <PermissionWrapper permission="dockets.create">
                    <Button onClick={() => setCreateModalOpen(true)}>
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