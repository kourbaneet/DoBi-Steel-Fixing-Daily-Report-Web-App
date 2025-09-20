"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { updateContractorSchema, UpdateContractorInput } from "@/modules/contractor/validations"
import { CONTRACTOR_POSITIONS } from "@/modules/contractor/constants"
import { ContractorSummary } from "@/modules/contractor/types"

interface FullContractorData {
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
  createdAt: Date
  updatedAt: Date
}

interface EditContractorModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  contractor: ContractorSummary
}

export function EditContractorModal({
  open,
  onClose,
  onSuccess,
  contractor,
}: EditContractorModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fullContractorData, setFullContractorData] = useState<FullContractorData | null>(null)

  const form = useForm<Omit<UpdateContractorInput, 'id'>>({
    resolver: zodResolver(updateContractorSchema.omit({ id: true })),
    defaultValues: {
      nickname: "",
      firstName: "",
      lastName: "",
      fullName: "",
      email: "",
      phone: "",
      position: "",
      experience: "",
      hourlyRate: 0,
      abn: "",
      bankName: "",
      bsb: "",
      accountNo: "",
      homeAddress: "",
      active: true,
    },
  })

  useEffect(() => {
    const fetchFullContractorData = async () => {
      if (!open || !contractor) return

      try {
        setIsLoading(true)
        const response = await fetch(`/api/admin/contractors/${contractor.id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch contractor details")
        }

        const data = await response.json()
        const fullData = data.data.contractor as FullContractorData
        setFullContractorData(fullData)

        // Reset form with full data
        form.reset({
          nickname: fullData.nickname || "",
          firstName: fullData.firstName || "",
          lastName: fullData.lastName || "",
          fullName: fullData.fullName || "",
          email: fullData.email || "",
          phone: fullData.phone || "",
          position: fullData.position || "",
          experience: fullData.experience || "",
          hourlyRate: fullData.hourlyRate || 0,
          abn: fullData.abn || "",
          bankName: fullData.bankName || "",
          bsb: fullData.bsb || "",
          accountNo: fullData.accountNo || "",
          homeAddress: fullData.homeAddress || "",
          active: fullData.active,
        })
      } catch (error) {
        console.error("Error fetching contractor details:", error)
        toast.error("Failed to load contractor details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchFullContractorData()
  }, [open, contractor, form])

  const onSubmit = async (data: Omit<UpdateContractorInput, 'id'>) => {
    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/admin/contractors/${contractor.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, id: contractor.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update contractor")
      }

      form.reset()
      onSuccess()
    } catch (error) {
      console.error("Error updating contractor:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update contractor")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Edit Contractor</DialogTitle>
          <DialogDescription className="text-sm">
            Update contractor profile with their details and rates.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                <div className="h-9 w-full bg-muted rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                <div className="h-9 w-full bg-muted rounded animate-pulse" />
              </div>
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                <div className="h-9 w-full bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nickname *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter nickname" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONTRACTOR_POSITIONS.map((position) => (
                          <SelectItem key={position} value={position}>
                            {position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hourly Rate (AUD) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="abn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ABN</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter ABN" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="homeAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Home Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter home address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe experience and qualifications" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4 sm:pt-6">
              <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Banking Details</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter bank name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bsb"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>BSB</FormLabel>
                        <FormControl>
                          <Input placeholder="000-000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accountNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter account number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border p-3 sm:p-4 space-y-2 sm:space-y-0">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm sm:text-base">Active Status</FormLabel>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Enable this contractor for work assignments
                    </div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? "Updating..." : "Update Contractor"}
              </Button>
            </div>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}