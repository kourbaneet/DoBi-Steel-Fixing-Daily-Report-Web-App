"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  ArrowLeft,
  Calendar,
  Building,
  MapPin,
  Users,
  Clock,
  FileText,
  Image,
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  User,
} from "lucide-react"
import { EditDocketModal } from "@/components/docket/edit-docket-modal"
import { DeleteDocketModal } from "@/components/docket/delete-docket-modal"
import { PermissionWrapper } from "@/components/PermissionWrapper"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { toast } from "sonner"
import { DocketWithRelations } from "@/modules/docket/types"

export default function DocketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const docketId = params.docketId as string

  const [docket, setDocket] = useState<DocketWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  useEffect(() => {
    if (docketId) {
      fetchDocket()
    }
  }, [docketId])

  const fetchDocket = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dockets/${docketId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Docket not found")
          router.push("/dashboard/dockets")
          return
        }
        throw new Error("Failed to fetch docket")
      }

      const result = await response.json()
      setDocket(result.data.docket)
    } catch (error) {
      console.error("Error fetching docket:", error)
      toast.error("Failed to fetch docket details")
    } finally {
      setLoading(false)
    }
  }

  const handleEditSuccess = () => {
    setEditModalOpen(false)
    fetchDocket()
    toast.success("Docket updated successfully")
  }

  const handleDeleteSuccess = () => {
    setDeleteModalOpen(false)
    toast.success("Docket deleted successfully")
    router.push("/dashboard/dockets")
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString('en-AU')
  }

  const calculateTotalHours = () => {
    if (!docket?.entries) return { tonnage: 0, dayLabour: 0, total: 0 }
    
    return docket.entries.reduce(
      (acc, entry) => ({
        tonnage: acc.tonnage + Number(entry.tonnageHours),
        dayLabour: acc.dayLabour + Number(entry.dayLabourHours),
        total: acc.total + Number(entry.tonnageHours) + Number(entry.dayLabourHours),
      }),
      { tonnage: 0, dayLabour: 0, total: 0 }
    )
  }

  const getContractorDisplay = (contractor: any) => {
    return contractor.fullName || 
           `${contractor.firstName || ''} ${contractor.lastName || ''}`.trim() || 
           contractor.nickname
  }

  if (loading) {
    return (
      <ProtectedRoute permission="dockets.view">
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </ProtectedRoute>
    )
  }

  if (!docket) {
    return (
      <ProtectedRoute permission="dockets.view">
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">Docket not found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The docket you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => router.push("/dashboard/dockets")}
            >
              Back to Dockets
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const totalHours = calculateTotalHours()

  return (
    <ProtectedRoute permission="dockets.view">
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/dockets")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Docket Details
              </h1>
              <p className="text-muted-foreground">
                {formatDate(docket.date)} • {docket.builder.name}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <PermissionWrapper permission="dockets.edit">
                <DropdownMenuItem onClick={() => setEditModalOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              </PermissionWrapper>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </DropdownMenuItem>
              <PermissionWrapper permission="dockets.delete">
                <DropdownMenuItem 
                  onClick={() => setDeleteModalOpen(true)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </PermissionWrapper>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                  <p className="text-2xl font-bold">{totalHours.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Workers</p>
                  <p className="text-2xl font-bold">{docket.entries.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Tonnage Hours</p>
                  <p className="text-2xl font-bold">{totalHours.tonnage}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Day Labour</p>
                  <p className="text-2xl font-bold">{totalHours.dayLabour}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date</label>
                    <div className="flex items-center mt-1">
                      <Calendar className="mr-2 h-4 w-4" />
                      {formatDate(docket.date)}
                    </div>
                  </div>

                  {docket.scheduleNo && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Schedule Number</label>
                      <div className="mt-1">
                        <Badge variant="outline">{docket.scheduleNo}</Badge>
                      </div>
                    </div>
                  )}
                </div>

                {docket.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="mt-1 text-sm">{docket.description}</p>
                  </div>
                )}

                {docket.siteManagerName && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Site Manager</label>
                    <div className="flex items-center mt-1">
                      <User className="mr-2 h-4 w-4" />
                      {docket.siteManagerName}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Work Entries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Work Entries ({docket.entries.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {docket.entries.map((entry, index) => (
                    <div key={entry.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">
                          {getContractorDisplay(entry.contractor)}
                        </h4>
                        {entry.contractor.position && (
                          <Badge variant="secondary" className="text-xs">
                            {entry.contractor.position}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Tonnage Hours:</span>
                          <p className="font-medium">{Number(entry.tonnageHours)} hrs</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Day Labour Hours:</span>
                          <p className="font-medium">{Number(entry.dayLabourHours)} hrs</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total:</span>
                          <p className="font-bold">
                            {Number(entry.tonnageHours) + Number(entry.dayLabourHours)} hrs
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Media */}
            {docket.media && docket.media.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Image className="mr-2 h-5 w-5" />
                    Media ({docket.media.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {docket.media.map((media) => (
                      <div key={media.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={media.type === 'PHOTO' ? 'default' : 'secondary'}>
                            {media.type}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                        {media.caption && (
                          <p className="text-sm text-muted-foreground">{media.caption}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDateTime(media.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Location Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Builder</label>
                  <div className="mt-1">
                    <p className="font-medium">{docket.builder.name}</p>
                    <Badge variant="outline" className="mt-1">
                      {docket.builder.companyCode}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p className="font-medium mt-1">{docket.location.label}</p>
                  {docket.location.address && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {docket.location.address}
                    </p>
                  )}
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Supervisor</label>
                  <p className="font-medium mt-1">{docket.supervisor.name || 'Unknown'}</p>
                  {docket.supervisor.email && (
                    <p className="text-sm text-muted-foreground">{docket.supervisor.email}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle>Timestamps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">{formatDateTime(docket.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm">{formatDateTime(docket.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modals */}
        {docket && (
          <>
            <EditDocketModal
              open={editModalOpen}
              onClose={() => setEditModalOpen(false)}
              onSuccess={handleEditSuccess}
              docket={{
                id: docket.id,
                date: docket.date,
                builder: docket.builder,
                location: docket.location,
                supervisor: docket.supervisor,
                _count: {
                  entries: docket.entries.length,
                  media: docket.media?.length || 0,
                },
                scheduleNo: docket.scheduleNo,
                description: docket.description,
                siteManagerName: docket.siteManagerName,
                siteManagerSignatureUrl: docket.siteManagerSignatureUrl,
                createdAt: docket.createdAt,
                updatedAt: docket.updatedAt,
                builderId: docket.builderId,
                locationId: docket.locationId,
                supervisorId: docket.supervisorId,
              }}
            />

            <DeleteDocketModal
              open={deleteModalOpen}
              onClose={() => setDeleteModalOpen(false)}
              onSuccess={handleDeleteSuccess}
              docket={{
                id: docket.id,
                date: docket.date,
                builder: docket.builder,
                location: docket.location,
                supervisor: docket.supervisor,
                _count: {
                  entries: docket.entries.length,
                  media: docket.media?.length || 0,
                },
                scheduleNo: docket.scheduleNo,
                description: docket.description,
                siteManagerName: docket.siteManagerName,
                siteManagerSignatureUrl: docket.siteManagerSignatureUrl,
                createdAt: docket.createdAt,
                updatedAt: docket.updatedAt,
                builderId: docket.builderId,
                locationId: docket.locationId,
                supervisorId: docket.supervisorId,
              }}
            />
          </>
        )}
      </div>
    </ProtectedRoute>
  )
}