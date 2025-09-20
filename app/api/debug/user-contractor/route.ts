import { NextRequest, NextResponse } from "next/server"
import { composeMiddleware } from "@/lib/middleware/compose"
import { requireAuth } from "@/lib/middleware/auth"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { PRISMA } from "@/libs/prisma"

const debugHandler = async (req: ApiRequest) => {
  try {
    const userId = req.user?.id
    const userEmail = req.user?.email

    // Get user details
    const user = await PRISMA.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    // Get all contractors
    const contractors = await PRISMA.contractor.findMany({
      select: {
        id: true,
        userId: true,
        email: true,
        nickname: true,
        firstName: true,
        lastName: true
      },
      take: 10
    })

    // Check if any contractor has this user's email
    const contractorByEmail = await PRISMA.contractor.findFirst({
      where: { email: userEmail },
      select: {
        id: true,
        userId: true,
        email: true,
        nickname: true
      }
    })

    return ApiResponseUtil.success("Debug info", {
      currentUser: user,
      totalContractors: contractors.length,
      contractors: contractors,
      contractorByEmail: contractorByEmail,
      userId: userId,
      userEmail: userEmail
    })

  } catch (error) {
    console.error("Debug error:", error)
    return ApiResponseUtil.serverError("Debug failed")
  }
}

export async function GET(request: NextRequest) {
  const composedHandler = composeMiddleware([requireAuth()], debugHandler)
  return composedHandler(request as ApiRequest)
}