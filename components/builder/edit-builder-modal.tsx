"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { updateBuilderSchema } from "@/modules/builder/validations"
import { BuilderWithLocations } from "@/modules/builder/types"
import { toast } from "sonner"

interface EditBuilderModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  builder: BuilderWithLocations
}

// Define explicit form type to avoid complex inference issues
type EditBuilderFormValues = {
  name: string
  companyCode?: string
  abn?: string | null
  phone?: string | null
  address?: string | null
  website?: string | null
  supervisorRate?: number
  tieHandRate?: number
  tonnageRate?: number
  contactPerson?: string | null
  contactEmail?: string | null
}

export function EditBuilderModal({ open, onClose, onSuccess, builder }: EditBuilderModalProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm({
    defaultValues: {
      name: "",
      companyCode: "",
      abn: "",
      phone: "",
      address: "",
      website: "",
      contactPerson: "",
      contactEmail: "",
      supervisorRate: undefined as number | undefined,
      tieHandRate: undefined as number | undefined,
      tonnageRate: undefined as number | undefined,
    },
  })

  useEffect(() => {
    if (open && builder) {
      form.reset({
        name: builder.name,
        companyCode: builder.companyCode,
        abn: builder.abn || "",
        phone: builder.phone || "",
        address: builder.address || "",
        website: builder.website || "",
        contactPerson: builder.contactPerson || "",
        contactEmail: builder.contactEmail || "",
        supervisorRate: builder.supervisorRate ? Number(builder.supervisorRate) : undefined,
        tieHandRate: builder.tieHandRate ? Number(builder.tieHandRate) : undefined,
        tonnageRate: builder.tonnageRate ? Number(builder.tonnageRate) : undefined,
      })
    }
  }, [open, builder, form])

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)
      
      // Validate the data manually
      const validationResult = updateBuilderSchema.omit({ builderId: true }).safeParse(values)
      if (!validationResult.success) {
        // Handle validation errors
        const errors = validationResult.error.issues
        errors.forEach(error => {
          if (error.path[0]) {
            const fieldName = error.path[0] as string
            form.setError(fieldName as any, {
              type: 'manual',
              message: error.message
            })
          }
        })
        return
      }
      
      const response = await fetch(`/api/admin/builders/${builder.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validationResult.data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update builder")
      }

      onSuccess()
    } catch (error) {
      console.error("Error updating builder:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update builder")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>Edit Builder</DialogTitle>
          <DialogDescription>
            Update the builder information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-medium">Company Name *</label>
              <Input
                placeholder="Enter company name"
                className="text-sm"
                {...form.register("name", { required: "Company name is required" })}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Company Code</label>
              <Input
                placeholder="e.g., ACME-001"
                className="text-sm"
                {...form.register("companyCode")}
              />
              {form.formState.errors.companyCode && (
                <p className="text-sm text-destructive">{form.formState.errors.companyCode.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ABN</label>
              <Input
                placeholder="Australian Business Number"
                className="text-sm"
                {...form.register("abn")}
              />
              {form.formState.errors.abn && (
                <p className="text-sm text-destructive">{form.formState.errors.abn.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Contact Person</label>
              <Input
                placeholder="Primary contact name"
                className="text-sm"
                {...form.register("contactPerson")}
              />
              {form.formState.errors.contactPerson && (
                <p className="text-sm text-destructive">{form.formState.errors.contactPerson.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                placeholder="Phone number"
                className="text-sm"
                {...form.register("phone")}
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Contact Email</label>
              <Input
                type="email"
                placeholder="contact@company.com"
                className="text-sm"
                {...form.register("contactEmail")}
              />
              {form.formState.errors.contactEmail && (
                <p className="text-sm text-destructive">{form.formState.errors.contactEmail.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Website</label>
              <Input
                placeholder="https://company.com"
                className="text-sm"
                {...form.register("website")}
              />
              {form.formState.errors.website && (
                <p className="text-sm text-destructive">{form.formState.errors.website.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Supervisor Rate ($)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="text-sm"
                {...form.register("supervisorRate", { valueAsNumber: true })}
              />
              {form.formState.errors.supervisorRate && (
                <p className="text-sm text-destructive">{form.formState.errors.supervisorRate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tie Hand Rate ($)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="text-sm"
                {...form.register("tieHandRate", { valueAsNumber: true })}
              />
              {form.formState.errors.tieHandRate && (
                <p className="text-sm text-destructive">{form.formState.errors.tieHandRate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tonnage Rate ($)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="text-sm"
                {...form.register("tonnageRate", { valueAsNumber: true })}
              />
              {form.formState.errors.tonnageRate && (
                <p className="text-sm text-destructive">{form.formState.errors.tonnageRate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <Textarea
              placeholder="Company address"
              className="min-h-[80px] text-sm"
              {...form.register("address")}
            />
            {form.formState.errors.address && (
              <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Updating..." : "Update Builder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}