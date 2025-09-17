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
  Building, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  MapPin,
  Phone,
  Mail,
  Globe,
} from "lucide-react"
import { CreateBuilderModal } from "@/components/builder/create-builder-modal"
import { EditBuilderModal } from "@/components/builder/edit-builder-modal"
import { DeleteBuilderModal } from "@/components/builder/delete-builder-modal"
import { PermissionWrapper } from "@/components/PermissionWrapper"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { toast } from "sonner"
import { BuilderSummary, BuilderWithLocations } from "@/modules/builder/types"

interface BuildersPageData {
  builders: BuilderSummary[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
}

export default function BuildersPage() {
  const router = useRouter()
  const [data, setData] = useState<BuildersPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedBuilder, setSelectedBuilder] = useState<BuilderSummary | null>(null)
  const [selectedBuilderForEdit, setSelectedBuilderForEdit] = useState<BuilderWithLocations | null>(null)

  const fetchBuilders = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
      })

      const response = await fetch(`/api/admin/builders?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch builders")
      }

      const result = await response.json()
      
      // Transform API response to expected format
      const transformedData: BuildersPageData = {
        builders: result.data || [],
        totalCount: result.meta?.total || 0,
        page: result.meta?.page || 1,
        limit: result.meta?.limit || 20,
        totalPages: result.meta?.totalPages || 1
      }
      
      setData(transformedData)
    } catch (error) {
      console.error("Error fetching builders:", error)
      toast.error("Failed to fetch builders")
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, sortBy, sortOrder, searchTerm])

  useEffect(() => {
    fetchBuilders()
  }, [fetchBuilders])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, pageSize, sortBy, sortOrder])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  const handleCreateSuccess = () => {
    setCreateModalOpen(false)
    fetchBuilders()
    toast.success("Builder created successfully")
  }

  const handleEditSuccess = () => {
    setEditModalOpen(false)
    setSelectedBuilder(null)
    setSelectedBuilderForEdit(null)
    fetchBuilders()
    toast.success("Builder updated successfully")
  }

  const handleDeleteSuccess = () => {
    setDeleteModalOpen(false)
    setSelectedBuilder(null)
    fetchBuilders()
    toast.success("Builder deleted successfully")
  }

  const handleViewDetails = (builder: BuilderSummary) => {
    router.push(`/dashboard/admin/builders/${builder.id}`)
  }

  const handleEdit = async (builder: BuilderSummary) => {
    try {
      setSelectedBuilder(builder)
      
      // Fetch full builder data for editing
      const response = await fetch(`/api/admin/builders/${builder.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch builder details')
      }
      
      const result = await response.json()
      setSelectedBuilderForEdit(result.data.builder)
      setEditModalOpen(true)
    } catch (error) {
      console.error('Error fetching builder for edit:', error)
      toast.error('Failed to load builder details')
    }
  }

  const handleDelete = (builder: BuilderSummary) => {
    setSelectedBuilder(builder)
    setDeleteModalOpen(true)
  }


  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString()
  }

  const renderPagination = () => {
    if (!data) return null

    const { page, totalPages } = data
    const pages = []

    // Show fewer pages on mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    const pageRange = isMobile ? 1 : 2

    for (let i = Math.max(1, page - pageRange); i <= Math.min(totalPages, page + pageRange); i++) {
      pages.push(i)
    }

    return (
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
          <span className="hidden md:inline">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, data.totalCount)} of {data.totalCount} builders
          </span>
          <span className="md:hidden">
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
    <ProtectedRoute permission="builders.view">
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 lg:p-8 pt-4 sm:pt-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Builders</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage building companies and their locations
          </p>
        </div>
        <PermissionWrapper permission="builders.create">
          <div className="flex-shrink-0">
            <Button onClick={() => setCreateModalOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden xs:inline">Add Builder</span>
              <span className="xs:hidden">Add</span>
            </Button>
          </div>
        </PermissionWrapper>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-4">
            <CardTitle className="text-lg sm:text-xl">All Builders</CardTitle>

            {/* Search Bar */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search builders..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>

            {/* Controls */}
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-end sm:space-y-0 sm:space-x-2">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:flex sm:items-center sm:gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="companyCode">Code</SelectItem>
                    <SelectItem value="createdAt">Created</SelectItem>
                    <SelectItem value="updatedAt">Updated</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Asc</SelectItem>
                    <SelectItem value="desc">Desc</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data && data.builders.length > 0 ? (
            <>
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <div className="min-w-[700px] px-3 sm:px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Name</TableHead>
                      <TableHead className="min-w-[120px]">Company Code</TableHead>
                      <TableHead className="min-w-[180px]">Contact</TableHead>
                      <TableHead className="min-w-[100px]">Locations</TableHead>
                      <TableHead className="min-w-[100px] hidden sm:table-cell">Created</TableHead>
                      <TableHead className="text-right w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.builders.map((builder) => (
                      <TableRow key={builder.id}>
                        <TableCell className="min-w-0">
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate pr-2">{builder.name}</div>
                            {builder.website && (
                              <div className="flex items-center text-xs text-muted-foreground min-w-0 mt-1">
                                <Globe className="mr-1 h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{builder.website}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{builder.companyCode}</Badge>
                        </TableCell>
                        <TableCell className="min-w-0">
                          <div className="space-y-1 min-w-0 pr-2">
                            {builder.contactPerson && (
                              <div className="text-xs sm:text-sm truncate font-medium">{builder.contactPerson}</div>
                            )}
                            {builder.phone && (
                              <div className="flex items-center text-xs text-muted-foreground min-w-0">
                                <Phone className="mr-1 h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{builder.phone}</span>
                              </div>
                            )}
                            {builder.contactEmail && (
                              <div className="flex items-center text-xs text-muted-foreground min-w-0">
                                <Mail className="mr-1 h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{builder.contactEmail}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MapPin className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <Badge variant="secondary" className="text-xs">{builder.locationCount}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{formatDate(builder.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 touch-manipulation">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(builder)}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">View Details</span>
                                <span className="sm:hidden">View</span>
                              </DropdownMenuItem>
                              <PermissionWrapper permission="builders.edit">
                                <DropdownMenuItem onClick={() => handleEdit(builder)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              </PermissionWrapper>
                              <PermissionWrapper permission="builders.delete">
                                <DropdownMenuItem
                                  onClick={() => handleDelete(builder)}
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
            <div className="text-center py-12 px-4">
              <Building className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-base font-semibold text-gray-900">No builders</h3>
              <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                Get started by creating a new builder to manage building companies.
              </p>
              <PermissionWrapper permission="builders.create">
                <div className="mt-6">
                  <Button onClick={() => setCreateModalOpen(true)} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Builder
                  </Button>
                </div>
              </PermissionWrapper>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateBuilderModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {selectedBuilderForEdit && (
        <EditBuilderModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setSelectedBuilder(null)
            setSelectedBuilderForEdit(null)
          }}
          onSuccess={handleEditSuccess}
          builder={selectedBuilderForEdit}
        />
      )}

      {selectedBuilder && (
        <DeleteBuilderModal
          open={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false)
            setSelectedBuilder(null)
          }}
          onSuccess={handleDeleteSuccess}
          builder={selectedBuilder}
        />
      )}
      </div>
    </ProtectedRoute>
  )
}