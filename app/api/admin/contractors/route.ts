import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/libs/next-auth"
import { PRISMA } from "@/libs/prisma"
import { hasPermission } from "@/lib/permissions"
import { ApiResponseUtil as apiResponse } from "@/lib/api-response"
import { contractorSearchSchema, createContractorSchema } from "@/modules/contractor/validations"
import { ContractorListResponse } from "@/modules/contractor/types"
import { ContractorService } from "@/modules/contractor/services"
import { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.role) {
      return apiResponse.unauthorized("Authentication required")
    }

    if (!hasPermission(session.user.role, "contractors.view")) {
      return apiResponse.forbidden("Insufficient permissions to view contractors")
    }

    const { searchParams } = new URL(request.url)
    const queryParams = {
      search: searchParams.get("search") || undefined,
      position: searchParams.get("position") || undefined,
      active: searchParams.get("active") ? searchParams.get("active") === "true" : undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20,
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
    }

    const validatedParams = contractorSearchSchema.parse(queryParams)
    const { search, position, active, page, limit, sortBy, sortOrder } = validatedParams

    const where: Prisma.ContractorWhereInput = {}

    if (search) {
      where.OR = [
        { nickname: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { fullName: { contains: search } },
        { email: { contains: search } },
        { position: { contains: search } },
        { abn: { contains: search } },
      ]
    }

    if (position) {
      where.position = { contains: position }
    }

    if (active !== undefined) {
      where.active = active
    }

    const [contractors, totalCount] = await Promise.all([
      ContractorService.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        includeBankInfo: false, // Never include bank info in listing
      }),
      ContractorService.count(where),
    ])

    const totalPages = Math.ceil(totalCount / limit)

    const contractorsWithFormattedRates = contractors.map(contractor => ({
      ...contractor,
      hourlyRate: Number(contractor.hourlyRate),
    }))

    return apiResponse.paginated(
      "Contractors retrieved successfully",
      contractorsWithFormattedRates,
      page,
      limit,
      totalCount,
      totalPages
    )
  } catch (error) {
    console.error("Error fetching contractors:", error)
    return apiResponse.serverError("Failed to fetch contractors")
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.role) {
      return apiResponse.unauthorized("Authentication required")
    }

    if (!hasPermission(session.user.role, "contractors.create")) {
      return apiResponse.forbidden("Insufficient permissions to create contractors")
    }

    const body = await request.json()
    const validatedData = createContractorSchema.parse(body)

    // Check if nickname is unique
    const existingContractor = await ContractorService.findByNickname(validatedData.nickname)

    if (existingContractor) {
      return apiResponse.badRequest("A contractor with this nickname already exists")
    }

    // Check if email is unique (if provided)
    if (validatedData.email) {
      const existingEmail = await ContractorService.findByEmail(validatedData.email)

      if (existingEmail) {
        return apiResponse.badRequest("A contractor with this email already exists")
      }
    }

    const contractor = await ContractorService.create(validatedData)

    return apiResponse.success(
      "Contractor created successfully",
      { contractor },
      201
    )
  } catch (error) {
    console.error("Error creating contractor:", error)
    return apiResponse.serverError("Failed to create contractor")
  }
}