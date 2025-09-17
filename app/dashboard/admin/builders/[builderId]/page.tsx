"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  Building,
  MapPin,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  Calendar,
  Phone,
  Mail,
  Globe,
  DollarSign,
} from "lucide-react"
import { EditBuilderModal } from "@/components/builder/edit-builder-modal"
import { CreateBuilderLocationModal } from "@/components/builder/create-builder-location-modal"
import { EditBuilderLocationModal } from "@/components/builder/edit-builder-location-modal"
import { DeleteBuilderLocationModal } from "@/components/builder/delete-builder-location-modal"
import { PermissionWrapper } from "@/components/PermissionWrapper"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { toast } from "sonner"
import { BuilderWithLocations } from "@/modules/builder/types"
import { BuilderLocation } from "@prisma/client"

interface BuilderDetailPageProps {
  params: Promise<{
    builderId: string
  }>
}

export default function BuilderDetailPage({ params }: BuilderDetailPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [builder, setBuilder] = useState<BuilderWithLocations | null>(null)
  const [loading, setLoading] = useState(true)

  // Locations search and pagination
  const [locationSearch, setLocationSearch] = useState("")
  const [filteredLocations, setFilteredLocations] = useState<BuilderLocation[]>([])

  // Modal states
  const [editBuilderModalOpen, setEditBuilderModalOpen] = useState(false)
  const [createLocationModalOpen, setCreateLocationModalOpen] = useState(false)
  const [editLocationModalOpen, setEditLocationModalOpen] = useState(false)
  const [deleteLocationModalOpen, setDeleteLocationModalOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<BuilderLocation | null>(null)

  const fetchBuilder = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/builders/${resolvedParams.builderId}`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Builder not found")
          router.push("/dashboard/admin/builders")
          return
        }
        throw new Error("Failed to fetch builder")
      }

      const result = await response.json()
      const builderData = result.data.builder
      setBuilder(builderData)
    } catch (error) {
      console.error("Error fetching builder:", error)
      toast.error("Failed to fetch builder details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBuilder()
  }, [resolvedParams.builderId])

  // Filter locations based on search
  useEffect(() => {
    if (!builder?.locations) {
      setFilteredLocations([])
      return
    }

    if (!locationSearch.trim()) {
      setFilteredLocations(builder.locations)
      return
    }

    const filtered = builder.locations.filter(location =>
      location.label.toLowerCase().includes(locationSearch.toLowerCase()) ||
      (location.address && location.address.toLowerCase().includes(locationSearch.toLowerCase()))
    )
    setFilteredLocations(filtered)
  }, [builder?.locations, locationSearch])




  const handleEditBuilderSuccess = () => {
    setEditBuilderModalOpen(false)
    fetchBuilder()
    toast.success("Builder updated successfully")
  }

  const handleCreateLocationSuccess = () => {
    setCreateLocationModalOpen(false)
    fetchBuilder()
    toast.success("Location created successfully")
  }

  const handleEditLocationSuccess = () => {
    setEditLocationModalOpen(false)
    setSelectedLocation(null)
    fetchBuilder()
    toast.success("Location updated successfully")
  }

  const handleDeleteLocationSuccess = () => {
    setDeleteLocationModalOpen(false)
    setSelectedLocation(null)
    fetchBuilder()
    toast.success("Location deleted successfully")
  }

  const handleEditLocation = (location: BuilderLocation) => {
    setSelectedLocation(location)
    setEditLocationModalOpen(true)
  }

  const handleDeleteLocation = (location: BuilderLocation) => {
    setSelectedLocation(location)
    setDeleteLocationModalOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 lg:p-8 pt-4 sm:pt-6">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!builder) {
    return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 lg:p-8 pt-4 sm:pt-6">
        <div className="text-center py-12 px-4">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-base font-semibold text-gray-900">Builder not found</h3>
          <p className="mt-2 text-sm text-gray-500">
            The builder you&apos;re looking for doesn&apos;t exist.
          </p>
          <div className="mt-6">
            <Button onClick={() => router.push("/dashboard/admin/builders")} size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Builders
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute permission="builders.view">
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 lg:p-8 pt-4 sm:pt-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/admin/builders">Builders</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{builder.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{builder.name}</h1>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 text-muted-foreground mt-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Company Code:</span>
              <Badge variant="outline" className="text-xs">{builder.companyCode}</Badge>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span className="text-xs sm:text-sm">Updated {new Date(builder.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
        {/* Left Pane - Builder Details */}
        <div className="space-y-4 sm:space-y-6 min-w-0">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  Basic Information
                </CardTitle>
                <PermissionWrapper permission="builders.edit">
                  <Button onClick={() => setEditBuilderModalOpen(true)} size="sm" className="text-sm">
                    <Edit className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Edit</span>
                    <span className="xs:hidden">Edit</span>
                  </Button>
                </PermissionWrapper>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                  <p className="text-sm break-words">{builder.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Company Code</label>
                  <p className="text-sm">{builder.companyCode}</p>
                </div>
                {builder.abn && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ABN</label>
                    <p className="text-sm">{builder.abn}</p>
                  </div>
                )}
                {builder.address && (
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <p className="text-sm break-words">{builder.address}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-3">
                {builder.contactPerson && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
                    <p className="text-sm break-words">{builder.contactPerson}</p>
                  </div>
                )}
                {builder.phone && (
                  <div className="flex items-start space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <p className="text-sm break-all">{builder.phone}</p>
                    </div>
                  </div>
                )}
                {builder.contactEmail && (
                  <div className="flex items-start space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-sm break-all">{builder.contactEmail}</p>
                    </div>
                  </div>
                )}
                {builder.website && (
                  <div className="flex items-start space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <label className="text-sm font-medium text-muted-foreground">Website</label>
                      <p className="text-sm break-all">{builder.website}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Default Rates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Default Rates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-3">
                {builder.supervisorRate && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Supervisor Rate</label>
                    <p className="text-sm font-mono">${builder.supervisorRate.toString()}</p>
                  </div>
                )}
                {builder.tieHandRate && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tie Hand Rate</label>
                    <p className="text-sm font-mono">${builder.tieHandRate.toString()}</p>
                  </div>
                )}
                {builder.tonnageRate && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tonnage Rate</label>
                    <p className="text-sm font-mono">${builder.tonnageRate.toString()}</p>
                  </div>
                )}
              </div>
              {!builder.supervisorRate && !builder.tieHandRate && !builder.tonnageRate && (
                <p className="text-sm text-muted-foreground italic">No default rates set</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Pane - Locations */}
        <div className="min-w-0">
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Locations ({builder.locations.length})
              </CardTitle>
              <PermissionWrapper permission="builders.locations.create">
                <Button onClick={() => setCreateLocationModalOpen(true)} size="sm" className="text-sm">
                  <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Add Location</span>
                  <span className="xs:hidden">Add</span>
                </Button>
              </PermissionWrapper>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            {builder.locations.length > 0 && (
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search locations..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            )}

            {/* Locations Table */}
            {filteredLocations.length > 0 ? (
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <div className="min-w-[500px] px-3 sm:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Label</TableHead>
                    <TableHead className="min-w-[150px] hidden sm:table-cell">Address</TableHead>
                    <TableHead className="min-w-[100px] hidden md:table-cell">Created</TableHead>
                    <TableHead className="text-right w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium pr-2">
                        <div className="min-w-0">
                          <div className="truncate">{location.label}</div>
                          <div className="sm:hidden text-xs text-muted-foreground mt-1 truncate">
                            {location.address || "No address"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell truncate">{location.address || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{new Date(location.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 touch-manipulation">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <PermissionWrapper permission="builders.locations.edit">
                              <DropdownMenuItem onClick={() => handleEditLocation(location)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </PermissionWrapper>
                            <PermissionWrapper permission="builders.locations.delete">
                              <DropdownMenuItem
                                onClick={() => handleDeleteLocation(location)}
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
            ) : builder.locations.length === 0 ? (
              /* Empty State - No Locations */
              <div className="text-center py-8 px-4">
                <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-base font-semibold text-gray-900">No locations yet</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Add your first location to organize work sites for this builder.
                </p>
                <PermissionWrapper permission="builders.locations.create">
                  <div className="mt-6">
                    <Button onClick={() => setCreateLocationModalOpen(true)} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Location
                    </Button>
                  </div>
                </PermissionWrapper>
              </div>
            ) : (
              /* No Search Results */
              <div className="text-center py-8 px-4">
                <Search className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  No locations found matching &quot;{locationSearch}&quot;
                </p>
                <button
                  onClick={() => setLocationSearch('')}
                  className="mt-3 text-sm text-primary hover:underline"
                >
                  Clear search
                </button>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>


      {/* Modals */}
      <EditBuilderModal
        open={editBuilderModalOpen}
        onClose={() => setEditBuilderModalOpen(false)}
        onSuccess={handleEditBuilderSuccess}
        builder={builder}
      />

      <CreateBuilderLocationModal
        open={createLocationModalOpen}
        onClose={() => setCreateLocationModalOpen(false)}
        onSuccess={handleCreateLocationSuccess}
        builderId={builder.id}
      />

      {selectedLocation && (
        <>
          <EditBuilderLocationModal
            open={editLocationModalOpen}
            onClose={() => {
              setEditLocationModalOpen(false)
              setSelectedLocation(null)
            }}
            onSuccess={handleEditLocationSuccess}
            builderId={builder.id}
            location={selectedLocation}
          />

          <DeleteBuilderLocationModal
            open={deleteLocationModalOpen}
            onClose={() => {
              setDeleteLocationModalOpen(false)
              setSelectedLocation(null)
            }}
            onSuccess={handleDeleteLocationSuccess}
            builderId={builder.id}
            location={selectedLocation}
          />
        </>
      )}
      </div>
    </ProtectedRoute>
  )
}