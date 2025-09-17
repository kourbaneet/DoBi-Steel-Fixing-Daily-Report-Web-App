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
  Users, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Phone,
  Mail,
  DollarSign,
  Filter,
  X,
} from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"
import { CreateContractorModal } from "@/components/contractor/create-contractor-modal"
import { toast } from "sonner"
import { ContractorSummary } from "@/modules/contractor/types"
import { CONTRACTOR_POSITIONS, CONTRACTOR_SORT_OPTIONS, CONTRACTOR_STATUS_OPTIONS } from "@/modules/contractor/constants"

interface ContractorsPageData {
  contractors: ContractorSummary[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
}

export default function ContractorsPage() {
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const [data, setData] = useState<ContractorsPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [positionFilter, setPositionFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<boolean | "">("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedContractor, setSelectedContractor] = useState<ContractorSummary | null>(null)

  const fetchContractors = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(positionFilter && positionFilter !== "all" && { position: positionFilter }),
        ...(statusFilter !== "" && { active: statusFilter.toString() }),
      })

      const response = await fetch(`/api/admin/contractors?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch contractors")
      }

      const result = await response.json()
      
      // Transform API response to expected format (matches builders pattern)
      const transformedData: ContractorsPageData = {
        contractors: result.data || [],
        totalCount: result.meta?.total || 0,
        page: result.meta?.page || 1,
        limit: result.meta?.limit || 20,
        totalPages: result.meta?.totalPages || 1
      }
      
      setData(transformedData)
    } catch (error) {
      console.error("Error fetching contractors:", error)
      toast.error("Failed to fetch contractors")
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, sortBy, sortOrder, searchTerm, positionFilter, statusFilter])

  useEffect(() => {
    fetchContractors()
  }, [fetchContractors])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, pageSize, sortBy, sortOrder, positionFilter, statusFilter])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setPositionFilter("all")
    setStatusFilter("")
  }

  const hasActiveFilters = searchTerm || (positionFilter && positionFilter !== "all") || statusFilter !== ""

  const handleCreateSuccess = () => {
    setCreateModalOpen(false)
    fetchContractors()
    toast.success("Contractor created successfully")
  }

  const handleEditSuccess = () => {
    setEditModalOpen(false)
    setSelectedContractor(null)
    fetchContractors()
    toast.success("Contractor updated successfully")
  }

  const handleDeleteSuccess = () => {
    setDeleteModalOpen(false)
    setSelectedContractor(null)
    fetchContractors()
    toast.success("Contractor deleted successfully")
  }

  const handleViewDetails = (contractor: ContractorSummary) => {
    router.push(`/dashboard/contractors/${contractor.id}`)
  }

  const handleEdit = (contractor: ContractorSummary) => {
    setSelectedContractor(contractor)
    setEditModalOpen(true)
  }

  const handleDelete = (contractor: ContractorSummary) => {
    setSelectedContractor(contractor)
    setDeleteModalOpen(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString()
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
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, data.totalCount)} of {data.totalCount} contractors
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
    <div className="flex-1 space-y-4 p-3 sm:p-4 md:p-6 lg:p-8 pt-4 sm:pt-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Contractors</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage contractors and their information
          </p>
        </div>
        {hasPermission("contractors.create") && (
          <div className="flex-shrink-0">
            <Button onClick={() => setCreateModalOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Contractor
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-4">
            <CardTitle className="text-lg sm:text-xl">All Contractors</CardTitle>

            {/* Search Bar */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contractors..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>

            {/* Filters and Controls */}
            <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              {/* Filters */}
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                <Select value={positionFilter} onValueChange={setPositionFilter}>
                  <SelectTrigger className="w-full text-sm">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Positions</SelectItem>
                    {CONTRACTOR_POSITIONS.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={statusFilter === "" ? "all" : statusFilter.toString()}
                  onValueChange={(value) => setStatusFilter(value === "all" ? "" : value === "true")}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {CONTRACTOR_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value.toString()} value={status.value.toString()}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="col-span-2 sm:col-span-1">
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Sort and Pagination Controls */}
              <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACTOR_SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Asc</SelectItem>
                    <SelectItem value="desc">Desc</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                  <SelectTrigger className="w-full text-sm">
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
          ) : data && data.contractors.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[160px]">Contractor</TableHead>
                      <TableHead className="min-w-[180px]">Contact</TableHead>
                      <TableHead className="min-w-[100px]">Position</TableHead>
                      <TableHead className="min-w-[120px]">Hourly Rate</TableHead>
                      <TableHead className="min-w-[80px]">Status</TableHead>
                      <TableHead className="min-w-[100px] hidden sm:table-cell">Created</TableHead>
                      <TableHead className="text-right w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.contractors.map((contractor) => (
                      <TableRow key={contractor.id}>
                        <TableCell className="min-w-0">
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{contractor.nickname}</div>
                            {contractor.fullName && (
                              <div className="text-xs text-muted-foreground truncate">
                                {contractor.fullName}
                              </div>
                            )}
                            {contractor.abn && (
                              <div className="text-xs text-muted-foreground truncate">
                                ABN: {contractor.abn}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-0">
                          <div className="space-y-1 min-w-0">
                            {contractor.email && (
                              <div className="flex items-center text-xs sm:text-sm min-w-0">
                                <Mail className="mr-1 h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{contractor.email}</span>
                              </div>
                            )}
                            {contractor.phone && (
                              <div className="flex items-center text-xs text-muted-foreground min-w-0">
                                <Phone className="mr-1 h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{contractor.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {contractor.position && (
                            <Badge variant="outline" className="text-xs">{contractor.position}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-xs sm:text-sm font-medium">
                            <DollarSign className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">{formatCurrency(contractor.hourlyRate)}/hr</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={contractor.active ? "default" : "secondary"} className="text-xs">
                            {contractor.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{formatDate(contractor.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(contractor)}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">View Details</span>
                                <span className="sm:hidden">View</span>
                              </DropdownMenuItem>
                              {hasPermission("contractors.edit") && (
                                <DropdownMenuItem onClick={() => handleEdit(contractor)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {hasPermission("contractors.delete") && (
                                <DropdownMenuItem
                                  onClick={() => handleDelete(contractor)}
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
              </div>
              
              <div className="mt-4">
                {renderPagination()}
              </div>
            </>
          ) : (
            <div className="text-center py-8 px-4">
              <Users className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
              <h3 className="mt-2 text-sm sm:text-base font-semibold text-gray-900">No contractors</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
                Get started by creating a new contractor.
              </p>
              {hasPermission("contractors.create") && (
                <div className="mt-4 sm:mt-6">
                  <Button onClick={() => setCreateModalOpen(true)} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Contractor
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateContractorModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}