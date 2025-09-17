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
import { Textarea } from "@/components/ui/textarea"
import { updateBuilderLocationSchema } from "@/modules/builder/validations"
import { BuilderLocation } from "@prisma/client"
import { toast } from "sonner"

interface EditBuilderLocationModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  builderId: string
  location: BuilderLocation
}

type EditBuilderLocationFormValues = Omit<z.infer<typeof updateBuilderLocationSchema>, 'builderId' | 'locationId'>

export function EditBuilderLocationModal({ 
  open, 
  onClose, 
  onSuccess, 
  builderId,
  location 
}: EditBuilderLocationModalProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<EditBuilderLocationFormValues>({
    resolver: zodResolver(updateBuilderLocationSchema.omit({ builderId: true, locationId: true })),
    defaultValues: {
      label: "",
      address: "",
    },
  })

  useEffect(() => {
    if (open && location) {
      form.reset({
        label: location.label,
        address: location.address || "",
      })
    }
  }, [open, location, form])

  const handleSubmit = async (values: EditBuilderLocationFormValues) => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/admin/builders/${builderId}/locations/${location.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update location")
      }

      onSuccess()
    } catch (error) {
      console.error("Error updating location:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update location")
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
      <DialogContent className="sm:max-w-[500px] mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>Edit Location</DialogTitle>
          <DialogDescription>
            Update the location information.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Label *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Main Office, Site 1" className="text-sm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the full address"
                      className="min-h-[80px] text-sm"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? "Updating..." : "Update Location"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}