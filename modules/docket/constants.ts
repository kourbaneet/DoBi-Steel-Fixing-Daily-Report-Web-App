export const DOCKET_CONSTANTS = {
  ERRORS: {
    SERVER_ERROR: "An error occurred while processing your request",
    DOCKET_NOT_FOUND: "Docket not found",
    VALIDATION_ERROR: "Validation failed",
    UNAUTHORIZED: "You are not authorized to perform this action",
    FORBIDDEN: "You don't have permission to access this docket",
    INVALID_ENTRIES: "At least one entry with hours greater than 0 is required",
    INVALID_HOURS: "Hours must be in 0.5 increments and greater than or equal to 0",
    BUILDER_NOT_FOUND: "Builder not found",
    LOCATION_NOT_FOUND: "Location not found",
    CONTRACTOR_NOT_FOUND: "Contractor not found",
    SUPERVISOR_NOT_FOUND: "Supervisor not found",
    SIGNATURE_REQUIRED: "Site manager signature is required",
  },
  SUCCESS: {
    DOCKET_CREATED: "Docket created successfully",
    DOCKET_UPDATED: "Docket updated successfully",
    DOCKET_DELETED: "Docket deleted successfully",
    DOCKETS_RETRIEVED: "Dockets retrieved successfully",
    DOCKET_RETRIEVED: "Docket retrieved successfully",
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },
  SORT: {
    DEFAULT_SORT_BY: 'date',
    DEFAULT_SORT_ORDER: 'desc',
    ALLOWED_SORT_FIELDS: ['date', 'createdAt', 'updatedAt'],
    ALLOWED_SORT_ORDERS: ['asc', 'desc'],
  },
  VALIDATION: {
    HOUR_INCREMENT: 0.5,
    MIN_HOURS: 0,
    MAX_HOURS: 24,
  }
} as const