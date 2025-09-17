import { requireAuth } from "@/lib/middleware/auth"
import { createMethodRoute } from "@/lib/middleware/compose"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { PRISMA } from "@/libs/prisma"

// POST handler - Create contractor profile for current user (TEST ONLY)
const createTestContractorHandler = async (req: ApiRequest) => {
  try {
    if (!req.user) {
      return ApiResponseUtil.unauthorized('Authentication required')
    }

    // Check if contractor already exists
    const existingContractor = await PRISMA.contractor.findFirst({
      where: {
        OR: [
          { userId: req.user.id },
          { email: req.user.email }
        ]
      }
    })

    if (existingContractor) {
      // If contractor exists but not linked, link it
      if (!existingContractor.userId && req.user.id) {
        const linkedContractor = await PRISMA.contractor.update({
          where: { id: existingContractor.id },
          data: { userId: req.user.id }
        })
        return ApiResponseUtil.success('Contractor profile linked successfully', linkedContractor)
      }
      return ApiResponseUtil.badRequest('Contractor profile already exists')
    }

    // Create new contractor
    const contractor = await PRISMA.contractor.create({
      data: {
        userId: req.user.id,
        email: req.user.email,
        nickname: req.user.name || req.user.email?.split('@')[0] || 'Worker',
        firstName: req.user.name?.split(' ')[0],
        lastName: req.user.name?.split(' ').slice(1).join(' ') || undefined,
        fullName: req.user.name || req.user.email,
        hourlyRate: 35.00, // Default rate
        active: true,
        position: 'Steel Fixer'
      }
    })

    return ApiResponseUtil.created('Test contractor profile created successfully', contractor)
  } catch (error) {
    console.error('Error creating test contractor:', error)
    return ApiResponseUtil.serverError('Failed to create contractor profile')
  }
}

// Create route with middleware
export const POST = createMethodRoute(
  'POST',
  [requireAuth()],
  createTestContractorHandler
).POST