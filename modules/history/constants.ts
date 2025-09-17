export const HISTORY_CONSTANTS = {
  SUCCESS: {
    DOCKETS_RETRIEVED: 'Dockets history retrieved successfully',
    PAYMENTS_RETRIEVED: 'Payments history retrieved successfully',
    EXPORT_GENERATED: 'Export generated successfully',
  },
  ERRORS: {
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Access denied - Admin access only',
    INVALID_DATE_RANGE: 'Invalid date range provided',
    INVALID_FILTERS: 'Invalid filters provided',
    SERVER_ERROR: 'Internal server error',
    EXPORT_FAILED: 'Failed to generate export',
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 500,
  },
  FORMATS: {
    DATE_FORMAT: 'MMM dd, yyyy',
    DECIMAL_PLACES: 2,
    CURRENCY: 'AUD',
  }
}