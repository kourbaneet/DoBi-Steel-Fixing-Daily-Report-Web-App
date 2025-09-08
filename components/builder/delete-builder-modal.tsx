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
import { BuilderSummary } from "@/modules/builder/types"
import { toast } from "sonner"

interface DeleteBuilderModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  builder: BuilderSummary
}

export function DeleteBuilderModal({ open, onClose, onSuccess, builder }: DeleteBuilderModalProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/admin/builders/${builder.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete builder")
      }

      onSuccess()
    } catch (error) {
      console.error("Error deleting builder:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete builder")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Builder</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{builder.name}</strong> (Code: {builder.companyCode})?
            <br /><br />
            This action cannot be undone. All locations associated with this builder will also be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Deleting..." : "Delete Builder"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}