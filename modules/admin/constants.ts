import { Role } from "@prisma/client"

export const ADMIN_CONSTANTS = {
  ERRORS: {
    UNAUTHORIZED: "Unauthorized access",
    FORBIDDEN: "Access denied. Admin role required",
    USER_NOT_FOUND: "User not found",
    INVALID_ROLE: "Invalid role specified",
    CANNOT_CHANGE_OWN_ROLE: "Cannot change your own admin role",
    VALIDATION_ERROR: "Validation error",
    SERVER_ERROR: "Internal server error",
  },

  SUCCESS: {
    ROLE_UPDATED: "User role updated successfully",
    USER_DELETED: "User deleted successfully",
    USERS_UPDATED: "Users updated successfully",
    USER_INVITED: "User invitation sent successfully",
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
}