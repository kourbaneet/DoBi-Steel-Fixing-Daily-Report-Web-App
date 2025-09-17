import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/libs/next-auth"
import { PRISMA } from "@/libs/prisma"
import { hasPermission } from "@/lib/permissions"
import { ApiResponseUtil as apiResponse } from "@/lib/api-response"
import { updateContractorSchema } from "@/modules/contractor/validations"
import { ContractorService } from "@/modules/contractor/services"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contractorId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.role) {
      return apiResponse.unauthorized("Authentication required")
    }

    if (!hasPermission(session.user.role, "contractors.view")) {
      return apiResponse.forbidden("Insufficient permissions to view contractors")
    }

    const { contractorId } = await params;
    const contractor = await ContractorService.findById(contractorId)

    if (!contractor) {
      return apiResponse.notFound("Contractor not found")
    }

    return apiResponse.success(
      "Contractor retrieved successfully",
      {
        contractor: {
          ...contractor,
          hourlyRate: Number(contractor.hourlyRate)
        }
      }
    )
  } catch (error) {
    console.error("Error fetching contractor:", error)
    return apiResponse.serverError("Failed to fetch contractor")
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ contractorId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.role) {
      return apiResponse.unauthorized("Authentication required")
    }

    if (!hasPermission(session.user.role, "contractors.edit")) {
      return apiResponse.forbidden("Insufficient permissions to edit contractors")
    }

    const body = await request.json()
    const { contractorId } = await params;
    const validatedData = updateContractorSchema.parse({
      ...body,
      id: contractorId,
    })

    // Check if contractor exists
    const existingContractor = await ContractorService.findByIdWithoutBankInfo(contractorId)

    if (!existingContractor) {
      return apiResponse.notFound("Contractor not found")
    }

    // Check if nickname is unique (if being updated)
    if (validatedData.nickname && validatedData.nickname !== existingContractor.nickname) {
      const nicknameExists = await ContractorService.findByNickname(validatedData.nickname)

      if (nicknameExists) {
        return apiResponse.badRequest("A contractor with this nickname already exists")
      }
    }

    // Check if email is unique (if being updated)
    if (validatedData.email && validatedData.email !== existingContractor.email) {
      const emailExists = await ContractorService.findByEmail(validatedData.email)

      if (emailExists) {
        return apiResponse.badRequest("A contractor with this email already exists")
      }
    }

    const { id, ...updateData } = validatedData

    const contractor = await ContractorService.update(contractorId, updateData)

    return apiResponse.success(
      "Contractor updated successfully",
      { 
        contractor: {
          ...contractor,
          hourlyRate: Number(contractor.hourlyRate)
        }
      }
    )
  } catch (error) {
    console.error("Error updating contractor:", error)
    return apiResponse.serverError("Failed to update contractor")
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ contractorId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.role) {
      return apiResponse.unauthorized("Authentication required")
    }

    if (!hasPermission(session.user.role, "contractors.delete")) {
      return apiResponse.forbidden("Insufficient permissions to delete contractors")
    }

    const { contractorId } = await params;
    // Check if contractor exists
    const existingContractor = await ContractorService.findByIdWithoutBankInfo(contractorId)

    if (!existingContractor) {
      return apiResponse.notFound("Contractor not found")
    }

    await ContractorService.delete(contractorId)

    return apiResponse.success("Contractor deleted successfully", null)
  } catch (error) {
    console.error("Error deleting contractor:", error)
    return apiResponse.serverError("Failed to delete contractor")
  }
}