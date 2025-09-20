"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Calendar,
  Edit,
  ArrowLeft,
  Building,
  FileText,
  CreditCard,
} from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"
import { toast } from "sonner"
import { EditContractorModal } from "@/components/contractor/edit-contractor-modal"

interface ContractorDetail {
  id: string
  nickname: string
  firstName?: string | null
  lastName?: string | null
  fullName?: string | null
  email?: string | null
  phone?: string | null
  position?: string | null
  experience?: string | null
  hourlyRate: number
  abn?: string | null
  bankName?: string | null
  bsb?: string | null
  accountNo?: string | null
  homeAddress?: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export default function ContractorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const [contractor, setContractor] = useState<ContractorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editModalOpen, setEditModalOpen] = useState(false)

  const contractorId = params.contractorId as string

  useEffect(() => {
    if (contractorId) {
      fetchContractor()
    }
  }, [contractorId])

  const fetchContractor = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/contractors/${contractorId}`)

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Contractor not found")
          router.push("/dashboard/contractors")
          return
        }
        throw new Error("Failed to fetch contractor")
      }

      const result = await response.json()
      setContractor(result.data.contractor)
    } catch (error) {
      console.error("Error fetching contractor:", error)
      toast.error("Failed to load contractor details")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getDisplayName = (contractor: ContractorDetail) => {
    return contractor.fullName ||
           `${contractor.firstName || ''} ${contractor.lastName || ''}`.trim() ||
           contractor.nickname
  }

  const handleEditSuccess = () => {
    setEditModalOpen(false)
    fetchContractor() // Refresh the data
    toast.success("Contractor updated successfully")
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-3 sm:p-4 md:p-6 lg:p-8 pt-4 sm:pt-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid gap-4 md:gap-6 lg:gap-8">
          <Skeleton className="h-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    )
  }

  if (!contractor) {
    return (
      <div className="flex-1 space-y-4 p-3 sm:p-4 md:p-6 lg:p-8 pt-4 sm:pt-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold">Contractor not found</h3>
          <p className="text-muted-foreground">The requested contractor could not be found.</p>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/contractors")}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contractors
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-3 sm:p-4 md:p-6 lg:p-8 pt-4 sm:pt-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/contractors")}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
              {getDisplayName(contractor)}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Contractor Details
            </p>
          </div>
        </div>
        {hasPermission("contractors.edit") && (
          <Button
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => setEditModalOpen(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Contractor
          </Button>
        )}
      </div>

      {/* Status Badge */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={contractor.active ? "default" : "secondary"} className="text-sm">
          {contractor.active ? "Active" : "Inactive"}
        </Badge>
        {contractor.position && (
          <Badge variant="outline" className="text-sm">
            {contractor.position}
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl flex items-center">
              <User className="mr-2 h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nickname</label>
                <p className="text-sm sm:text-base font-medium">{contractor.nickname}</p>
              </div>
              {contractor.firstName && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">First Name</label>
                  <p className="text-sm sm:text-base">{contractor.firstName}</p>
                </div>
              )}
              {contractor.lastName && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                  <p className="text-sm sm:text-base">{contractor.lastName}</p>
                </div>
              )}
              {contractor.fullName && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="text-sm sm:text-base">{contractor.fullName}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contractor.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{contractor.email}</p>
                  </div>
                </div>
              )}
              {contractor.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{contractor.phone}</p>
                  </div>
                </div>
              )}
              {contractor.homeAddress && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Home Address</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{contractor.homeAddress}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl flex items-center">
                <Building className="mr-2 h-5 w-5" />
                Work Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Hourly Rate</p>
                  <p className="text-sm sm:text-base font-semibold">{formatCurrency(contractor.hourlyRate)}/hr</p>
                </div>
              </div>
              {contractor.abn && (
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">ABN</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{contractor.abn}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{formatDate(contractor.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Banking Information */}
        {(contractor.bankName || contractor.bsb || contractor.accountNo) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Banking Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {contractor.bankName && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Bank Name</label>
                    <p className="text-sm sm:text-base">{contractor.bankName}</p>
                  </div>
                )}
                {contractor.bsb && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">BSB</label>
                    <p className="text-sm sm:text-base font-mono">{contractor.bsb}</p>
                  </div>
                )}
                {contractor.accountNo && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Account Number</label>
                    <p className="text-sm sm:text-base font-mono">***{contractor.accountNo.slice(-4)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Experience */}
        {contractor.experience && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Experience & Qualifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap">
                {contractor.experience}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Modal */}
      {contractor && (
        <EditContractorModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          contractor={{
            id: contractor.id,
            nickname: contractor.nickname,
            firstName: contractor.firstName,
            lastName: contractor.lastName,
            fullName: contractor.fullName,
            email: contractor.email,
            phone: contractor.phone,
            position: contractor.position,
            hourlyRate: contractor.hourlyRate,
            abn: contractor.abn,
            active: contractor.active,
            createdAt: new Date(contractor.createdAt),
            updatedAt: new Date(contractor.updatedAt),
          }}
        />
      )}
    </div>
  )
}