"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import { DocketListItem } from "@/modules/docket/types"
import { toast } from "sonner"

interface DeleteDocketModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  docket: DocketListItem
}

export function DeleteDocketModal({ open, onClose, onSuccess, docket }: DeleteDocketModalProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/dockets/${docket.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete docket")
      }

      onSuccess()
    } catch (error) {
      console.error("Error deleting docket:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete docket")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] mx-4 sm:mx-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Delete Docket</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete this docket? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg border p-3 sm:p-4 space-y-3">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Date:</span>
              <div className="font-medium">{formatDate(docket.date)}</div>
            </div>
            
            <div>
              <span className="text-sm font-medium text-muted-foreground">Builder:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{docket.builder.name}</span>
                <Badge variant="outline" className="text-xs">
                  {docket.builder.companyCode}
                </Badge>
              </div>
            </div>

            <div>
              <span className="text-sm font-medium text-muted-foreground">Location:</span>
              <div className="font-medium">{docket.location.label}</div>
            </div>

            <div>
              <span className="text-sm font-medium text-muted-foreground">Supervisor:</span>
              <div className="font-medium">{docket.supervisor.name || 'Unknown'}</div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 pt-2">
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">Entries:</span>
                <Badge variant="secondary">{docket._count.entries}</Badge>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">Media:</span>
                <Badge variant="outline">{docket._count.media}</Badge>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              <strong>Warning:</strong> Deleting this docket will permanently remove:
            </p>
            <ul className="text-sm text-destructive mt-2 ml-4 list-disc space-y-1">
              <li>All work entries and hours</li>
              <li>Any attached media files</li>
              <li>All associated data</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading} className="w-full sm:w-auto">
            {loading ? "Deleting..." : "Delete Docket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}