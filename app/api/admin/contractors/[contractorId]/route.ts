import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/libs/next-auth"
import { PRISMA } from "@/libs/prisma"
import { hasPermission } from "@/lib/permissions"
import { ApiResponseUtil as apiResponse } from "@/lib/api-response"
import { updateContractorSchema } from "@/modules/contractor/validations"

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
    const contractor = await PRISMA.contractor.findUnique({
      where: { id: contractorId },
      include: {
        user: true,
      },
    })

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
    const existingContractor = await PRISMA.contractor.findUnique({
      where: { id: contractorId },
    })

    if (!existingContractor) {
      return apiResponse.notFound("Contractor not found")
    }

    // Check if nickname is unique (if being updated)
    if (validatedData.nickname && validatedData.nickname !== existingContractor.nickname) {
      const nicknameExists = await PRISMA.contractor.findUnique({
        where: { nickname: validatedData.nickname },
      })

      if (nicknameExists) {
        return apiResponse.badRequest("A contractor with this nickname already exists")
      }
    }

    // Check if email is unique (if being updated)
    if (validatedData.email && validatedData.email !== existingContractor.email) {
      const emailExists = await PRISMA.contractor.findUnique({
        where: { email: validatedData.email },
      })

      if (emailExists) {
        return apiResponse.badRequest("A contractor with this email already exists")
      }
    }

    const { id, ...updateData } = validatedData
    
    const contractor = await PRISMA.contractor.update({
      where: { id: contractorId },
      data: {
        ...updateData,
        email: validatedData.email || null,
      },
      include: {
        user: true,
      },
    })

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
    const existingContractor = await PRISMA.contractor.findUnique({
      where: { id: contractorId },
    })

    if (!existingContractor) {
      return apiResponse.notFound("Contractor not found")
    }

    await PRISMA.contractor.delete({
      where: { id: contractorId },
    })

    return apiResponse.success("Contractor deleted successfully", null)
  } catch (error) {
    console.error("Error deleting contractor:", error)
    return apiResponse.serverError("Failed to delete contractor")
  }
}