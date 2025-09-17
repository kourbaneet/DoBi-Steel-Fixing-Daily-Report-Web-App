"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { X, Plus, Minus } from "lucide-react"
import { createDocketSchema } from "@/modules/docket/validations"
import { toast } from "sonner"

interface CreateDocketModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface Builder {
  id: string
  name: string
  companyCode: string
  locations: {
    id: string
    label: string
  }[]
}

interface Contractor {
  id: string
  nickname: string
  firstName?: string
  lastName?: string
  fullName?: string
  position?: string
  active: boolean
}

export function CreateDocketModal({ open, onClose, onSuccess }: CreateDocketModalProps) {
  const [loading, setLoading] = useState(false)
  const [builders, setBuilders] = useState<Builder[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [selectedBuilderLocations, setSelectedBuilderLocations] = useState<{id: string, label: string}[]>([])

  const form = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      builderId: "",
      locationId: "",
      scheduleNo: "",
      description: "",
      siteManagerName: "",
      entries: [
        {
          contractorId: "",
          tonnageHours: 0,
          dayLabourHours: 0,
        }
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "entries",
  })

  const watchedBuilderId = form.watch("builderId")

  useEffect(() => {
    if (open) {
      fetchBuilders()
      fetchContractors()
    }
  }, [open])

  useEffect(() => {
    if (watchedBuilderId && builders.length > 0) {
      const builder = builders.find(b => b.id === watchedBuilderId)
      console.log('Selected builder:', builder)
      console.log('Builder locations:', builder?.locations)
      if (builder && builder.locations && builder.locations.length > 0) {
        setSelectedBuilderLocations(builder.locations)
        form.setValue("locationId", "")
        console.log('Set locations:', builder.locations)
      } else {
        console.log('No locations found for builder')
        setSelectedBuilderLocations([])
      }
    } else {
      setSelectedBuilderLocations([])
    }
  }, [watchedBuilderId, builders, form])

  const fetchBuilders = async () => {
    try {
      const response = await fetch("/api/admin/builders?limit=100")
      if (response.ok) {
        const result = await response.json()
        console.log('API response:', result)
        console.log('Builders data:', result.data)
        // Ensure each builder has a locations array
        const buildersWithLocations = (result.data || []).map((builder: any) => ({
          ...builder,
          locations: builder.locations || []
        }))
        console.log('Processed builders:', buildersWithLocations)

        setBuilders(buildersWithLocations)
      }
    } catch (error) {
      console.error("Error fetching builders:", error)
      setBuilders([])
    }
  }

  console.log(builders);
  

  const fetchContractors = async () => {
    try {
      const response = await fetch("/api/admin/contractors?limit=100")
      if (response.ok) {
        const result = await response.json()
        setContractors(result.data?.filter((c: Contractor) => c.active) || [])
      }
    } catch (error) {
      console.error("Error fetching contractors:", error)
      setContractors([])
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)

      // Validate the data
      const validationResult = createDocketSchema.safeParse({
        ...values,
        date: new Date(values.date),
        entries: values.entries.map((entry: any) => ({
          ...entry,
          tonnageHours: parseFloat(entry.tonnageHours) || 0,
          dayLabourHours: parseFloat(entry.dayLabourHours) || 0,
        }))
      })

      if (!validationResult.success) {
        const errors = validationResult.error.issues
        errors.forEach(error => {
          const path = error.path.join('.')
          toast.error(`${path}: ${error.message}`)
        })
        return
      }

      const response = await fetch("/api/dockets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validationResult.data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create docket")
      }

      form.reset()
      onSuccess()
    } catch (error) {
      console.error("Error creating docket:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create docket")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  const addEntry = () => {
    append({
      contractorId: "",
      tonnageHours: 0,
      dayLabourHours: 0,
    })
  }

  const removeEntry = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const getContractorDisplay = (contractor: Contractor) => {
    return contractor.fullName || `${contractor.firstName || ''} ${contractor.lastName || ''}`.trim() || contractor.nickname
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>Create New Docket</DialogTitle>
          <DialogDescription>
            Create a new daily work report for tracking hours and activities.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    className="text-sm"
                    {...form.register("date", { required: "Date is required" })}
                  />
                  {form.formState.errors.date && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.date.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Schedule Number
                  </label>
                  <Input
                    placeholder="e.g., SCH-001"
                    className="text-sm"
                    {...form.register("scheduleNo")}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Description
                </label>
                <Textarea
                  placeholder="Description of work performed..."
                  className="text-sm min-h-[80px]"
                  {...form.register("description")}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Site Manager Name
                </label>
                <Input
                  placeholder="Site manager name"
                  className="text-sm"
                  {...form.register("siteManagerName")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Location Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Builder <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={form.watch("builderId")}
                    onValueChange={(value) => form.setValue("builderId", value)}
                  >
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Select builder" />
                    </SelectTrigger>
                    <SelectContent>
                      {builders && builders.length > 0 ? builders.map((builder) => (
                        <SelectItem key={builder.id} value={builder.id}>
                          <div className="flex items-center">
                            <span>{builder.name}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {builder.companyCode}
                            </Badge>
                          </div>
                        </SelectItem>
                      )) : (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No builders available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.builderId && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.builderId.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={form.watch("locationId")}
                    onValueChange={(value) => form.setValue("locationId", value)}
                    disabled={!watchedBuilderId}
                  >
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedBuilderLocations && selectedBuilderLocations.length > 0 ? selectedBuilderLocations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.label}
                        </SelectItem>
                      )) : (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          {watchedBuilderId ? "No locations available" : "Select a builder first"}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.locationId && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.locationId.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Entries */}
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <CardTitle className="text-lg">Work Entries</CardTitle>
                <Button type="button" onClick={addEntry} size="sm" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden xs:inline">Add Entry</span>
                  <span className="xs:hidden">Add</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h4 className="font-medium">Entry {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeEntry(index)}
                      >
                        <Minus className="h-4 w-4" />
                        <span className="sr-only">Remove entry</span>
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Contractor <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={form.watch(`entries.${index}.contractorId`)}
                        onValueChange={(value) => form.setValue(`entries.${index}.contractorId`, value)}
                      >
                        <SelectTrigger className="w-full text-sm">
                          <SelectValue placeholder="Select contractor" />
                        </SelectTrigger>
                        <SelectContent>
                          {contractors && contractors.length > 0 ? contractors.map((contractor) => (
                            <SelectItem key={contractor.id} value={contractor.id}>
                              <div>
                                <div>{getContractorDisplay(contractor)}</div>
                                {contractor.position && (
                                  <div className="text-xs text-muted-foreground">
                                    {contractor.position}
                                  </div>
                                )}
                              </div>
                            </SelectItem>
                          )) : (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              No contractors available
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Tonnage Hours
                      </label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="0.0"
                        className="text-sm"
                        {...form.register(`entries.${index}.tonnageHours`, {
                          valueAsNumber: true,
                          min: { value: 0, message: "Hours cannot be negative" }
                        })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Day Labour Hours
                      </label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="0.0"
                        className="text-sm"
                        {...form.register(`entries.${index}.dayLabourHours`, {
                          valueAsNumber: true,
                          min: { value: 0, message: "Hours cannot be negative" }
                        })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Separator />

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-2">
            <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Creating..." : "Create Docket"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}