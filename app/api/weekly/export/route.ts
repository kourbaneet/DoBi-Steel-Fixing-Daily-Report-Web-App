import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/middleware/auth'
import { createMethodRoute } from '@/lib/middleware/compose'
import { ApiRequest } from '@/lib/middleware/types'
import { WeeklyService } from '@/modules/weekly/services'
import { weeklyExportSchema } from '@/modules/weekly/validations'
import { WEEKLY_CONSTANTS } from '@/modules/weekly/constants'
import { WeeklyRow } from '@/modules/weekly/types'

// CSV Export Helper
function generateCSV(data: WeeklyRow[], weekStart: string, weekEnd: string): string {
  const headers = [
    'Contractor Name',
    'Nickname', 
    'Email',
    'Builder',
    'Company Code',
    'Location',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday', 
    'Friday',
    'Saturday',
    'Tonnage Hours',
    'Day Labour Hours',
    'Total Hours',
    'Hourly Rate',
    'Total Amount'
  ]

  const rows = data.map(row => [
    getContractorDisplayName(row),
    row.nickname,
    row.email || '',
    row.builderName,
    row.companyCode,
    row.locationLabel,
    row.mon,
    row.tue,
    row.wed,
    row.thu,
    row.fri,
    row.sat,
    row.tonnageHours,
    row.dayLabourHours,
    row.totalHours,
    row.rate,
    row.totalAmount
  ])

  // Add header comment
  const csvContent = [
    `# Weekly Timesheet Export`,
    `# Week: ${weekStart} to ${weekEnd}`,
    `# Generated: ${new Date().toISOString()}`,
    `# Total Contractors: ${data.length}`,
    '',
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

function getContractorDisplayName(row: WeeklyRow): string {
  if (row.fullName) return row.fullName
  if (row.firstName || row.lastName) {
    return `${row.firstName || ''} ${row.lastName || ''}`.trim()
  }
  return row.nickname
}

// GET handler - Export weekly data
const exportWeeklyHandler = async (req: ApiRequest) => {
  try {
    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const params = {
      week: searchParams.get('week') || undefined,
      weekStart: searchParams.get('weekStart') || undefined,
      builderId: searchParams.get('builderId') || undefined,
      locationId: searchParams.get('locationId') || undefined,
      q: searchParams.get('q') || undefined,
      format: (searchParams.get('format') || 'csv') as 'csv' | 'xlsx',
    }

    // Remove undefined values
    Object.keys(params).forEach(key => {
      const value = params[key as keyof typeof params]
      if (value === undefined) {
        delete params[key as keyof typeof params]
      }
    })

    // Validate parameters
    const validationResult = weeklyExportSchema.safeParse(params)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid parameters',
          errors: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    const { format, ...weeklyParams } = validationResult.data

    // Get weekly data
    const result = await WeeklyService.getWeeklyData(weeklyParams, req.user)
    const { rows, weekStart, weekEnd, totals } = result.data

    if (format === 'csv') {
      const csvContent = generateCSV(rows, weekStart, weekEnd)
      
      const headers = new Headers()
      headers.set('Content-Type', 'text/csv; charset=utf-8')
      headers.set('Content-Disposition', `attachment; filename="weekly-timesheet-${weekStart}.csv"`)
      
      return new NextResponse(csvContent, { headers })
    }

    // For now, only CSV is implemented
    // XLSX implementation would go here using a library like 'xlsx' or 'exceljs'
    return NextResponse.json(
      { 
        success: false, 
        message: 'XLSX export not yet implemented. Please use CSV format.' 
      },
      { status: 501 }
    )

  } catch (error) {
    console.error('Error exporting weekly data:', error)
    
    if (error instanceof Error) {
      if (error.message === WEEKLY_CONSTANTS.ERRORS.UNAUTHORIZED) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 401 }
        )
      }
      if (error.message === WEEKLY_CONSTANTS.ERRORS.FORBIDDEN) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 403 }
        )
      }
      if (error.message.includes('Invalid week') || error.message.includes('Invalid date')) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { success: false, message: WEEKLY_CONSTANTS.ERRORS.EXPORT_FAILED },
      { status: 500 }
    )
  }
}

// Create routes with middleware
export const GET = createMethodRoute(
  'GET',
  [
    requireAuth(),
    requireRole(['ADMIN', 'SUPERVISOR']) // Only ADMIN and SUPERVISOR can export weekly data
  ],
  exportWeeklyHandler
).GET