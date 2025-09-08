"use client"

import { useState } from "react"
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
import { createBuilderLocationSchema } from "@/modules/builder/validations"
import { toast } from "sonner"

interface CreateBuilderLocationModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  builderId: string
}

type CreateBuilderLocationFormValues = Omit<z.infer<typeof createBuilderLocationSchema>, 'builderId'>

export function CreateBuilderLocationModal({ 
  open, 
  onClose, 
  onSuccess, 
  builderId 
}: CreateBuilderLocationModalProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<CreateBuilderLocationFormValues>({
    resolver: zodResolver(createBuilderLocationSchema.omit({ builderId: true })),
    defaultValues: {
      label: "",
      address: "",
    },
  })

  const handleSubmit = async (values: CreateBuilderLocationFormValues) => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/admin/builders/${builderId}/locations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create location")
      }

      form.reset()
      onSuccess()
    } catch (error) {
      console.error("Error creating location:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create location")
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Location</DialogTitle>
          <DialogDescription>
            Add a new location for this builder.
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
                    <Input placeholder="e.g., Main Office, Site 1" {...field} />
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
                      className="min-h-[80px]"
                      {...field} 
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Location"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}