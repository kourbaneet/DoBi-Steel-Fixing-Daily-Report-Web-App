export const BUILDER_CONSTANTS = {
  ERRORS: {
    SERVER_ERROR: "An error occurred while processing your request",
    BUILDER_NOT_FOUND: "Builder not found",
    COMPANY_CODE_EXISTS: "Company code already exists",
    VALIDATION_ERROR: "Validation failed",
    UNAUTHORIZED: "You are not authorized to perform this action",
    LOCATION_NOT_FOUND: "Builder location not found",
    LOCATION_LABEL_EXISTS: "Location label already exists for this builder",
  },
  SUCCESS: {
    BUILDER_CREATED: "Builder created successfully",
    BUILDER_UPDATED: "Builder updated successfully", 
    BUILDER_DELETED: "Builder deleted successfully",
    LOCATION_CREATED: "Builder location created successfully",
    LOCATION_UPDATED: "Builder location updated successfully",
    LOCATION_DELETED: "Builder location deleted successfully",
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
  SORT: {
    DEFAULT_SORT_BY: 'createdAt',
    DEFAULT_SORT_ORDER: 'desc',
    ALLOWED_SORT_FIELDS: ['name', 'companyCode', 'createdAt', 'updatedAt'],
    ALLOWED_SORT_ORDERS: ['asc', 'desc'],
  }
} as const