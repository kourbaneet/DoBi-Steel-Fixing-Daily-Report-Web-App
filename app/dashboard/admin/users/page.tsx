"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Role } from '@prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  Loader2, 
  Search, 
  Filter, 
  Users, 
  UserCheck, 
  UserX, 
  Calendar,
  ChevronDown,
  MoreHorizontal,
  Trash2,
  UserCog,
  Mail,
  MailCheck
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { AdminUser } from "@/modules/admin/types"
import { getAvailableRoles, formatDateTime, getUserInitials } from "@/modules/admin/helpers"

interface UserListResponse {
  success: boolean
  message: string
  data?: AdminUser[]
  errors?: any
  meta?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all')
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all')
  
  // Role update state
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage && !loading) {
      setCurrentPage(newPage)
      fetchUsers(newPage)
    }
  }

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(emailVerifiedFilter === 'verified' && { emailVerified: 'true' }),
        ...(emailVerifiedFilter === 'unverified' && { emailVerified: 'false' }),
      })

      const response = await fetch(`/api/admin/users?${params}`)
      const result: UserListResponse = await response.json()

      if (result.success && result.data && result.meta) {
        setUsers(result.data)
        setTotalCount(result.meta.total)
        setCurrentPage(result.meta.page)
        setTotalPages(result.meta.totalPages)
        setError('')
      } else {
        setError(result.errors?.message || result.message || 'Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: Role) => {
    try {
      setUpdatingUserId(userId)
      setError('')
      setSuccess('')

      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role: newRole,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(result.message || 'User role updated successfully')
        // Update the user in the local state
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ))
      } else {
        setError(result.errors?.message || result.message || 'Failed to update user role')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      setError('Failed to update user role')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      setError('')
      setSuccess('')

      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(result.message || 'User deleted successfully')
        // Remove user from local state
        setUsers(prev => prev.filter(user => user.id !== userId))
        setTotalCount(prev => prev - 1)
      } else {
        setError(result.errors?.message || result.message || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      setError('Failed to delete user')
    }
  }

  const getRoleBadgeVariant = (role: Role) => {
    switch (role) {
      case 'ADMIN': return 'destructive'
      case 'SUPERVISOR': return 'default'
      case 'WORKER': return 'secondary'
      default: return 'outline'
    }
  }

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1)
    fetchUsers(1)
  }, [search, roleFilter, emailVerifiedFilter])

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('')
        setError('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You must be logged in to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 lg:p-8 pt-4 sm:pt-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage user accounts and roles across your organization
          </p>
        </div>
        <div className="flex-shrink-0">
          <Badge variant="outline" className="flex items-center gap-1 text-sm">
            <Users className="h-3 w-3" />
            {totalCount} users
          </Badge>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <UserCheck className="h-4 w-4" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <UserX className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Compact Filters Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 sm:pb-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm sm:text-base">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-4">
            {/* Search - Full width on mobile */}
            <div className="space-y-1.5">
              <Label htmlFor="search" className="text-xs font-medium text-muted-foreground">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Name, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Role</Label>
                <Select value={roleFilter} onValueChange={(value: Role | 'all') => setRoleFilter(value)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                    <SelectItem value="WORKER">Worker</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Email Status</Label>
                <Select value={emailVerifiedFilter} onValueChange={(value: 'all' | 'verified' | 'unverified') => setEmailVerifiedFilter(value)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="verified">
                      <div className="flex items-center gap-1.5">
                        <MailCheck className="h-3 w-3 text-green-600" />
                        <span className="text-sm">Verified</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="unverified">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-orange-600" />
                        <span className="text-sm">Unverified</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                <Label className="text-xs font-medium text-muted-foreground">Action</Label>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(1)}
                  disabled={loading}
                  className="w-full h-9 text-sm"
                >
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Refresh'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Users Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading users...</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No users found</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                No users match your current filter criteria.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setRoleFilter('all')
                  setEmailVerifiedFilter('all')
                  fetchUsers(1)
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="rounded-md border border-border/50 mx-3 sm:mx-0">
                <Table className="min-w-[700px]">
                  <TableHeader>
                    <TableRow className="bg-muted/25">
                      <TableHead className="font-semibold min-w-[180px]">User</TableHead>
                      <TableHead className="font-semibold min-w-[80px]">Role</TableHead>
                      <TableHead className="font-semibold min-w-[100px]">Status</TableHead>
                      <TableHead className="font-semibold min-w-[100px] hidden md:table-cell">Joined</TableHead>
                      <TableHead className="font-semibold text-right min-w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, index) => (
                      <TableRow key={user.id} className="hover:bg-muted/25 transition-colors">
                        <TableCell className="min-w-0 pr-2">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={user.image || undefined} />
                              <AvatarFallback className="text-xs font-medium">
                                {getUserInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate pr-2">{user.name || 'Unnamed User'}</div>
                              <div className="text-xs text-muted-foreground truncate pr-2">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="pr-2">
                          <Badge variant={getRoleBadgeVariant(user.role)} className="font-medium text-xs whitespace-nowrap">
                            {user.role}
                          </Badge>
                        </TableCell>

                        <TableCell className="pr-2">
                          <div className="flex items-center">
                            {user.emailVerified ? (
                              <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 text-xs whitespace-nowrap">
                                <MailCheck className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="hidden sm:inline">Verified</span>
                                <span className="sm:hidden">✓</span>
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-orange-700 border-orange-200 bg-orange-50 text-xs whitespace-nowrap">
                                <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="hidden sm:inline">Pending</span>
                                <span className="sm:hidden">⏳</span>
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="hidden md:table-cell pr-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{formatDateTime(user.createdAt)}</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Role Change Dropdown */}
                            <Select
                              value={user.role}
                              onValueChange={(newRole: Role) => updateUserRole(user.id, newRole)}
                              disabled={updatingUserId === user.id}
                            >
                              <SelectTrigger className="w-20 sm:w-24 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(Role).map((role) => (
                                  <SelectItem key={role} value={role}>
                                    <div className="flex items-center gap-2">
                                      <UserCog className="h-3 w-3" />
                                      <span className="text-xs">{role}</span>
                                      {role === user.role && (
                                        <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">(Current)</span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {updatingUserId === user.id && (
                              <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                            )}

                            {/* Actions Dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 touch-manipulation">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => deleteUser(user.id)}
                                  disabled={user.id === session.user?.id}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 px-3 sm:px-6 py-3 border-t bg-muted/25">
              <div className="flex items-center justify-center sm:justify-start space-x-1 text-xs sm:text-sm text-muted-foreground">
                <span className="hidden md:inline">Showing</span>
                <span className="font-medium text-foreground">
                  {((currentPage - 1) * 20) + 1}-{Math.min(currentPage * 20, totalCount)}
                </span>
                <span>of</span>
                <span className="font-medium text-foreground">{totalCount}</span>
                <span className="hidden md:inline">users</span>
              </div>

              <Pagination>
                <PaginationContent className="gap-0 sm:gap-1">
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange(currentPage - 1)
                      }}
                      className={`text-xs sm:text-sm px-1 sm:px-2 md:px-3 ${currentPage <= 1 || loading ? "pointer-events-none opacity-50" : ""}`}
                    />
                  </PaginationItem>

                  {/* First page */}
                  {currentPage > 3 && (
                    <>
                      <PaginationItem className="hidden md:block">
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            handlePageChange(1)
                          }}
                          isActive={currentPage === 1}
                          className="text-xs sm:text-sm px-2 sm:px-3"
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                      {currentPage > 4 && (
                        <PaginationItem className="hidden sm:block">
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                    </>
                  )}

                  {/* Page numbers around current page */}
                  {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                    const page = Math.max(1, currentPage - 1) + i
                    if (page > totalPages) return null

                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            handlePageChange(page)
                          }}
                          isActive={page === currentPage}
                          className={`text-xs sm:text-sm px-2 sm:px-3 min-w-[32px] sm:min-w-[36px] ${loading ? "pointer-events-none opacity-50" : ""}`}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  {/* Last page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && (
                        <PaginationItem className="hidden sm:block">
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem className="hidden sm:block">
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            handlePageChange(totalPages)
                          }}
                          isActive={currentPage === totalPages}
                          className="text-xs sm:text-sm"
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange(currentPage + 1)
                      }}
                      className={`text-xs sm:text-sm px-2 sm:px-3 ${currentPage >= totalPages || loading ? "pointer-events-none opacity-50" : ""}`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}