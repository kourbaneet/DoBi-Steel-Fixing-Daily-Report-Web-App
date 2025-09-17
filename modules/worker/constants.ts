export const WORKER_CONSTANTS = {
  SUCCESS: {
    WEEKS_RETRIEVED: 'Weeks retrieved successfully',
    WEEK_DETAILS_RETRIEVED: 'Week details retrieved successfully',
  },
  ERRORS: {
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Access denied - Worker access only',
    CONTRACTOR_NOT_FOUND: 'No contractor profile found for your account. Please contact your administrator to set up your contractor profile.',
    NO_TIMESHEET_DATA: 'No timesheet data found for this period',
    INVALID_WEEK_FORMAT: 'Invalid week format',
    SERVER_ERROR: 'Internal server error',
  },
  ROLES: {
    WORKER_ONLY: ['WORKER']
  },
  FORMATS: {
    DECIMAL_PLACES: 2,
    WEEK_FORMAT: 'YYYY-[W]WW',
    DATE_FORMAT: 'MMM dd, yyyy'
  }
}