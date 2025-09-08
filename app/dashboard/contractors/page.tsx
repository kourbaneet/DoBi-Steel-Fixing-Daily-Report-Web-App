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
    
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
      pages.push(i)
    }

    return (
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, data.totalCount)} of {data.totalCount} contractors
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
          <h2 className="text-3xl font-bold tracking-tight">Contractors</h2>
          <p className="text-muted-foreground">
            Manage contractors and their information
          </p>
        </div>
        {hasPermission("contractors.create") && (
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Contractor
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Contractors</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contractors..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="w-[150px]">
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
                <SelectTrigger className="w-[120px]">
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
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[130px]">
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
          ) : data && data.contractors.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contractor</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Hourly Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.contractors.map((contractor) => (
                    <TableRow key={contractor.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{contractor.nickname}</div>
                          {contractor.fullName && (
                            <div className="text-sm text-muted-foreground">
                              {contractor.fullName}
                            </div>
                          )}
                          {contractor.abn && (
                            <div className="text-xs text-muted-foreground">
                              ABN: {contractor.abn}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {contractor.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="mr-1 h-3 w-3" />
                              {contractor.email}
                            </div>
                          )}
                          {contractor.phone && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Phone className="mr-1 h-3 w-3" />
                              {contractor.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {contractor.position && (
                          <Badge variant="outline">{contractor.position}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm font-medium">
                          <DollarSign className="mr-1 h-4 w-4" />
                          {formatCurrency(contractor.hourlyRate)}/hr
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={contractor.active ? "default" : "secondary"}>
                          {contractor.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(contractor.createdAt)}</TableCell>
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
                              View Details
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
              
              <div className="mt-4">
                {renderPagination()}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No contractors</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new contractor.
              </p>
              {hasPermission("contractors.create") && (
                <div className="mt-6">
                  <Button onClick={() => setCreateModalOpen(true)}>
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