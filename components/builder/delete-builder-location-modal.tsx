"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { BuilderLocation } from "@prisma/client"
import { toast } from "sonner"

interface DeleteBuilderLocationModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  builderId: string
  location: BuilderLocation
}

export function DeleteBuilderLocationModal({ 
  open, 
  onClose, 
  onSuccess, 
  builderId,
  location 
}: DeleteBuilderLocationModalProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/admin/builders/${builderId}/locations/${location.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete location")
      }

      onSuccess()
    } catch (error) {
      console.error("Error deleting location:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete location")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Location</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the location <strong>&quot;{location.label}&quot;</strong>?
            <br /><br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Deleting..." : "Delete Location"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}