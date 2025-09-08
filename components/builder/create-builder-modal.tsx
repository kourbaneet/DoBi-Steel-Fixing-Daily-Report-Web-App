"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
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
import { createBuilderSchema } from "@/modules/builder/validations"
import { toast } from "sonner"

interface CreateBuilderModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateBuilderModal({ open, onClose, onSuccess }: CreateBuilderModalProps) {
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

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)
      
      // Validate the data manually
      const validationResult = createBuilderSchema.safeParse(values)
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
      
      const response = await fetch("/api/admin/builders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validationResult.data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create builder")
      }

      form.reset()
      onSuccess()
    } catch (error) {
      console.error("Error creating builder:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create builder")
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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Builder</DialogTitle>
          <DialogDescription>
            Add a new building company to your system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium">Company Name *</label>
              <Input 
                placeholder="Enter company name" 
                {...form.register("name", { required: "Company name is required" })}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Company Code *</label>
              <Input 
                placeholder="e.g., ACME-001" 
                {...form.register("companyCode", { required: "Company code is required" })}
              />
              {form.formState.errors.companyCode && (
                <p className="text-sm text-destructive">{form.formState.errors.companyCode.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ABN</label>
              <Input 
                placeholder="Australian Business Number" 
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
              className="min-h-[80px]"
              {...form.register("address")}
            />
            {form.formState.errors.address && (
              <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Builder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}