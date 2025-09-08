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
import { usePermissions } from "@/hooks/usePermissions"
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
  const { hasPermission } = usePermissions()
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
    
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
      pages.push(i)
    }

    return (
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, data.totalCount)} of {data.totalCount} builders
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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Builders</h2>
          <p className="text-muted-foreground">
            Manage building companies and their locations
          </p>
        </div>
        {hasPermission("builders.create") && (
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Builder
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Builders</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search builders..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[130px]">
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
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company Code</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Locations</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.builders.map((builder) => (
                    <TableRow key={builder.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{builder.name}</div>
                          {builder.website && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Globe className="mr-1 h-3 w-3" />
                              {builder.website}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{builder.companyCode}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {builder.contactPerson && (
                            <div className="text-sm">{builder.contactPerson}</div>
                          )}
                          {builder.phone && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Phone className="mr-1 h-3 w-3" />
                              {builder.phone}
                            </div>
                          )}
                          {builder.contactEmail && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Mail className="mr-1 h-3 w-3" />
                              {builder.contactEmail}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="mr-1 h-4 w-4" />
                          <Badge variant="secondary">{builder.locationCount}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(builder.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(builder)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {hasPermission("builders.edit") && (
                              <DropdownMenuItem onClick={() => handleEdit(builder)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {hasPermission("builders.delete") && (
                              <DropdownMenuItem 
                                onClick={() => handleDelete(builder)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
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
              <Building className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No builders</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new builder.
              </p>
              {hasPermission("builders.create") && (
                <div className="mt-6">
                  <Button onClick={() => setCreateModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Builder
                  </Button>
                </div>
              )}
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

      {selectedBuilder && (
        <>
          <EditBuilderModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false)
              setSelectedBuilder(null)
            }}
            onSuccess={handleEditSuccess}
            builder={selectedBuilder}
          />

          <DeleteBuilderModal
            open={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false)
              setSelectedBuilder(null)
            }}
            onSuccess={handleDeleteSuccess}
            builder={selectedBuilder}
          />
        </>
      )}
    </div>
  )
}