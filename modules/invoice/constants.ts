export const INVOICE_CONSTANTS = {
  SUCCESS: {
    INVOICE_CREATED: 'Invoice created and submitted successfully',
    INVOICE_UPDATED: 'Invoice updated successfully',
    INVOICE_STATUS_UPDATED: 'Invoice status updated successfully',
    INVOICE_PDF_GENERATED: 'Invoice PDF generated successfully',
    INVOICE_EMAIL_SENT: 'Invoice email sent successfully',
  },
  ERRORS: {
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Access denied - Admin access only',
    CONTRACTOR_NOT_FOUND: 'No contractor profile found for your account. Please contact your administrator to set up your contractor profile.',
    INVALID_WEEK_START: 'Invalid week start date',
    NO_TIMESHEET_DATA: 'No timesheet data found for this week',
    INVOICE_ALREADY_EXISTS: 'Invoice already exists for this week',
    INVOICE_NOT_FOUND: 'Invoice not found',
    EMAIL_SEND_FAILED: 'Failed to send invoice email',
    PDF_GENERATION_FAILED: 'Failed to generate invoice PDF',
    SERVER_ERROR: 'Internal server error',
  },
  EMAIL: {
    DIRECTOR_EMAIL: 'director@dobisteelfixing.com.au',
    SUBJECT: 'New Worker Invoice Submitted',
  },
  FORMATS: {
    DECIMAL_PLACES: 2,
    DATE_FORMAT: 'MMM dd, yyyy',
    CURRENCY: 'AUD',
  }
}