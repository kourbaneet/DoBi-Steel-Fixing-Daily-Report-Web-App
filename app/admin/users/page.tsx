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
import { Loader2, Search, Filter, Users, UserCheck, UserX, Calendar } from "lucide-react"
import { AdminUser } from "@/modules/admin/types"
import { getAvailableRoles, formatDateTime, getUserInitials } from "@/modules/admin/helpers"

interface UserListResponse {
  success: boolean
  data?: {
    users: AdminUser[]
    totalCount: number
    page: number
    limit: number
    totalPages: number
  }
  error?: string
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

      if (result.success && result.data) {
        setUsers(result.data.users)
        setTotalCount(result.data.totalCount)
        setCurrentPage(result.data.page)
        setTotalPages(result.data.totalPages)
      } else {
        setError(result.error || 'Failed to fetch users')
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
        setError(result.error || 'Failed to update user role')
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
        setError(result.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      setError('Failed to delete user')
    }
  }

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'SUPERVISOR': return 'bg-yellow-100 text-yellow-800'
      case 'WORKER': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  useEffect(() => {
    fetchUsers()
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts and roles ({totalCount} total users)
          </p>
        </div>
      </div>

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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="role-filter">Role</Label>
              <Select value={roleFilter} onValueChange={(value: Role | 'all') => setRoleFilter(value)}>
                <SelectTrigger id="role-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                  <SelectItem value="WORKER">Worker</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="email-filter">Email Status</Label>
              <Select value={emailVerifiedFilter} onValueChange={(value: 'all' | 'verified' | 'unverified') => setEmailVerifiedFilter(value)}>
                <SelectTrigger id="email-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your criteria.
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="font-medium">{user.name || 'Unnamed User'}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                        {user.emailVerified ? (
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            Unverified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Joined {formatDateTime(user.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Role Change Dropdown */}
                    <Select
                      value={user.role}
                      onValueChange={(newRole: Role) => updateUserRole(user.id, newRole)}
                      disabled={updatingUserId === user.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableRoles(user.role).map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                        <SelectItem value={user.role} disabled>
                          {user.role} (Current)
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {updatingUserId === user.id && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    {/* Delete Button */}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteUser(user.id)}
                      disabled={user.id === session.user?.id}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}