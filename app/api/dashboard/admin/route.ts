import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/middleware/auth"
import { createMethodRoute } from "@/lib/middleware/compose"
import { ApiRequest } from "@/lib/middleware/types"
import { ApiResponseUtil } from "@/lib/api-response"
import { PRISMA } from "@/libs/prisma"
import { WorkerInvoiceStatus } from "@prisma/client"

interface AdminDashboardData {
  kpis: {
    totalDockets: number
    uniqueContractors: number
    totalHours: {
      tonnage: number
      dayLabour: number
      combined: number
    }
    estimatedPayout: number
    invoices: {
      submitted: number
      paid: number
      unsubmitted: number
    }
  }
  charts: {
    hoursByDay: Array<{
      day: string
      dayName: string
      tonnage: number
      dayLabour: number
      total: number
    }>
    topCompanies: Array<{
      companyCode: string
      companyName: string
      totalHours: number
    }>
    topContractors: Array<{
      contractorId: string
      nickname: string
      totalHours: number
      estimatedPayout: number
    }>
  }
  tables: {
    pendingInvoices: Array<{
      id: string
      contractorNickname: string
      weekLabel: string
      totalHours: number
      totalAmount: number
      status: string
      submittedAt: string
    }>
    exceptions: Array<{
      id: string
      type: string
      contractorNickname: string
      message: string
      date: string
    }>
  }
  recentDockets: Array<{
    id: string
    date: string
    builderName: string
    companyCode: string
    locationLabel: string
    contractorCount: number
    totalHours: number
    mediaCount: number
    status: string
  }>
}

const getDashboardHandler = async (req: ApiRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Default to current week if no dates provided
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()

    // Set time boundaries
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    // 1. Count dockets in range
    const totalDockets = await PRISMA.docket.count({
      where: {
        date: {
          gte: start,
          lte: end
        }
      }
    })

    // 2. Get unique contractors and calculate hours + payout
    const docketEntries = await PRISMA.docketEntry.findMany({
      where: {
        docket: {
          date: {
            gte: start,
            lte: end
          }
        }
      },
      include: {
        contractor: {
          select: {
            id: true,
            nickname: true,
            hourlyRate: true
          }
        }
      }
    })

    // Calculate unique contractors
    const uniqueContractorIds = new Set(docketEntries.map(entry => entry.contractorId))
    const uniqueContractors = uniqueContractorIds.size

    // Calculate total hours
    const totalTonnageHours = docketEntries.reduce((sum, entry) => sum + (Number(entry.tonnageHours) || 0), 0)
    const totalDayLabourHours = docketEntries.reduce((sum, entry) => sum + (Number(entry.dayLabourHours) || 0), 0)
    const totalCombinedHours = totalTonnageHours + totalDayLabourHours

    // Calculate estimated payout
    const estimatedPayout = docketEntries.reduce((sum, entry) => {
      const entryHours = (Number(entry.tonnageHours) || 0) + (Number(entry.dayLabourHours) || 0)
      const rate = Number(entry.contractor?.hourlyRate) || 0
      return sum + (entryHours * rate)
    }, 0)

    // 3. Get invoice counts by status for the same date range
    const invoiceCounts = await PRISMA.workerInvoice.groupBy({
      by: ['status'],
      _count: {
        status: true
      },
      where: {
        weekStart: {
          gte: start,
          lte: end
        }
      }
    })

    // Process invoice counts
    const invoiceStats = {
      submitted: 0,
      paid: 0,
      unsubmitted: 0
    }

    invoiceCounts.forEach(count => {
      switch (count.status) {
        case WorkerInvoiceStatus.SUBMITTED:
          invoiceStats.submitted = count._count.status
          break
        case WorkerInvoiceStatus.PAID:
          invoiceStats.paid = count._count.status
          break
        case WorkerInvoiceStatus.DRAFT:
          invoiceStats.unsubmitted = count._count.status
          break
      }
    })

    // 4. Chart Data - Hours by Day (Mon-Sun stacked bars)
    const docketsWithEntries = await PRISMA.docket.findMany({
      where: {
        date: {
          gte: start,
          lte: end
        }
      },
      include: {
        entries: {
          select: {
            tonnageHours: true,
            dayLabourHours: true
          }
        }
      }
    })

    // Group hours by day of week
    const hoursByDay = Array.from({ length: 7 }, (_, i) => {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      return {
        day: i.toString(),
        dayName: dayNames[i],
        tonnage: 0,
        dayLabour: 0,
        total: 0
      }
    })

    docketsWithEntries.forEach(docket => {
      const dayOfWeek = docket.date.getDay() // 0 = Sunday, 1 = Monday, etc.
      const dayData = hoursByDay[dayOfWeek]

      docket.entries.forEach(entry => {
        const tonnage = Number(entry.tonnageHours) || 0
        const dayLabour = Number(entry.dayLabourHours) || 0
        dayData.tonnage += tonnage
        dayData.dayLabour += dayLabour
        dayData.total += tonnage + dayLabour
      })
    })

    // 5. Chart Data - Top Companies by Hours
    const companyHours = new Map<string, { companyCode: string; companyName: string; totalHours: number }>()

    const docketsWithBuilders = await PRISMA.docket.findMany({
      where: {
        date: {
          gte: start,
          lte: end
        }
      },
      include: {
        entries: {
          select: {
            tonnageHours: true,
            dayLabourHours: true
          }
        },
        builder: {
          select: {
            id: true,
            companyCode: true,
            name: true
          }
        }
      }
    })

    docketsWithBuilders.forEach(docket => {
      if (!docket.builder) return

      const builderId = docket.builder.id
      if (!companyHours.has(builderId)) {
        companyHours.set(builderId, {
          companyCode: docket.builder.companyCode || 'Unknown',
          companyName: docket.builder.name,
          totalHours: 0
        })
      }

      const company = companyHours.get(builderId)!
      docket.entries.forEach(entry => {
        const hours = (Number(entry.tonnageHours) || 0) + (Number(entry.dayLabourHours) || 0)
        company.totalHours += hours
      })
    })

    const topCompanies = Array.from(companyHours.values())
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 5)

    // 6. Chart Data - Top Contractors by Hours
    const contractorHours = new Map<string, { contractorId: string; nickname: string; totalHours: number; hourlyRate: number }>()

    docketEntries.forEach(entry => {
      const contractorId = entry.contractorId
      if (!contractorHours.has(contractorId)) {
        contractorHours.set(contractorId, {
          contractorId,
          nickname: entry.contractor?.nickname || 'Unknown',
          totalHours: 0,
          hourlyRate: Number(entry.contractor?.hourlyRate) || 0
        })
      }

      const contractor = contractorHours.get(contractorId)!
      const hours = (Number(entry.tonnageHours) || 0) + (Number(entry.dayLabourHours) || 0)
      contractor.totalHours += hours
    })

    const topContractors = Array.from(contractorHours.values())
      .map(contractor => ({
        contractorId: contractor.contractorId,
        nickname: contractor.nickname,
        totalHours: contractor.totalHours,
        estimatedPayout: contractor.totalHours * contractor.hourlyRate
      }))
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 10)

    // 7. Table Data - Pending Invoices (SUBMITTED status)
    const pendingInvoices = await PRISMA.workerInvoice.findMany({
      where: {
        status: WorkerInvoiceStatus.SUBMITTED,
        weekStart: {
          gte: start,
          lte: end
        }
      },
      include: {
        contractor: {
          select: {
            nickname: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      },
      take: 10
    })

    const pendingInvoicesData = pendingInvoices.map(invoice => ({
      id: invoice.id,
      contractorNickname: invoice.contractor.nickname,
      weekLabel: `${invoice.weekStart.toLocaleDateString('en-AU', { month: 'short', day: '2-digit' })} - ${invoice.weekEnd.toLocaleDateString('en-AU', { month: 'short', day: '2-digit' })}`,
      totalHours: Number(invoice.totalHours),
      totalAmount: Number(invoice.totalAmount),
      status: invoice.status,
      submittedAt: invoice.submittedAt?.toISOString() || ''
    }))

    // 8. Table Data - Exceptions (for now, we'll check for contractors with unusually high hours)
    const exceptionsData = docketEntries
      .reduce((acc, entry) => {
        const contractorId = entry.contractorId
        const totalHours = (Number(entry.tonnageHours) || 0) + (Number(entry.dayLabourHours) || 0)

        if (!acc[contractorId]) {
          acc[contractorId] = {
            nickname: entry.contractor?.nickname || 'Unknown',
            totalHours: 0,
            days: 0
          }
        }

        acc[contractorId].totalHours += totalHours
        acc[contractorId].days += 1

        return acc
      }, {} as Record<string, { nickname: string; totalHours: number; days: number }>)

    const exceptions = Object.entries(exceptionsData)
      .filter(([_, data]) => data.totalHours > 50) // Flag if more than 50 hours in the week
      .map(([contractorId, data], index) => ({
        id: `exc-${contractorId}-${index}`,
        type: 'High Hours',
        contractorNickname: data.nickname,
        message: `${data.totalHours.toFixed(1)} hours logged (${data.days} days)`,
        date: end.toISOString()
      }))
      .slice(0, 5)

    // 9. Recent Dockets Table
    const recentDockets = await PRISMA.docket.findMany({
      where: {
        date: {
          gte: start,
          lte: end
        }
      },
      include: {
        builder: {
          select: {
            name: true,
            companyCode: true
          }
        },
        location: {
          select: {
            label: true
          }
        },
        entries: {
          select: {
            tonnageHours: true,
            dayLabourHours: true
          }
        },
        media: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: 10
    })

    const recentDocketsData = recentDockets.map(docket => {
      const totalHours = docket.entries.reduce((sum, entry) => {
        return sum + (Number(entry.tonnageHours) || 0) + (Number(entry.dayLabourHours) || 0)
      }, 0)

      return {
        id: docket.id,
        date: docket.date.toLocaleDateString('en-AU', {
          weekday: 'short',
          month: 'short',
          day: '2-digit'
        }),
        builderName: docket.builder.name,
        companyCode: docket.builder.companyCode || 'N/A',
        locationLabel: docket.location.label,
        contractorCount: docket.entries.length,
        totalHours,
        mediaCount: docket.media.length,
        status: totalHours > 0 ? 'Active' : 'No Hours'
      }
    })

    const dashboardData: AdminDashboardData = {
      kpis: {
        totalDockets,
        uniqueContractors,
        totalHours: {
          tonnage: totalTonnageHours,
          dayLabour: totalDayLabourHours,
          combined: totalCombinedHours
        },
        estimatedPayout,
        invoices: invoiceStats
      },
      charts: {
        hoursByDay,
        topCompanies,
        topContractors
      },
      tables: {
        pendingInvoices: pendingInvoicesData,
        exceptions
      },
      recentDockets: recentDocketsData
    }

    return ApiResponseUtil.success(
      "Admin dashboard data retrieved successfully",
      dashboardData
    )

  } catch (error) {
    console.error("Error fetching admin dashboard data:", error)
    return ApiResponseUtil.serverError("Failed to fetch dashboard data")
  }
}

export const GET = createMethodRoute(
  'GET',
  [
    requireAuth(),
    requireRole(['ADMIN'])
  ],
  getDashboardHandler
).GET