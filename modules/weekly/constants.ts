export const WEEKLY_CONSTANTS = {
  SUCCESS: {
    WEEKLY_DATA_RETRIEVED: 'Weekly timesheet data retrieved successfully',
    WEEKLY_EXPORT_GENERATED: 'Weekly timesheet exported successfully',
  },
  ERRORS: {
    INVALID_WEEK_FORMAT: 'Invalid week format. Use YYYY-Www (e.g., 2025-W36) or provide weekStart',
    INVALID_WEEK_START: 'Invalid weekStart date format. Use YYYY-MM-DD',
    UNAUTHORIZED: 'You are not authorized to view weekly timesheets',
    FORBIDDEN: 'You do not have permission to perform this action',
    SERVER_ERROR: 'An error occurred while processing weekly timesheet data',
    EXPORT_FAILED: 'Failed to export weekly timesheet',
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 200,
  },
  DAYS: {
    WEEKDAYS: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const,
    WEEKDAY_NAMES: {
      mon: 'Monday',
      tue: 'Tuesday', 
      wed: 'Wednesday',
      thu: 'Thursday',
      fri: 'Friday',
      sat: 'Saturday',
    },
  },
  FORMATS: {
    DECIMAL_PLACES: 2,
    DATE_FORMAT: 'YYYY-MM-DD',
    WEEK_FORMAT: 'YYYY-Www',
  },
} as const

export type WeeklyDay = typeof WEEKLY_CONSTANTS.DAYS.WEEKDAYS[number]

export type InvoiceStatus = 'UNSUBMITTED' | 'SUBMITTED' | 'PAID'