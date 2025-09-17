import { format } from 'date-fns'
import { INVOICE_CONSTANTS } from './constants'
import { InvoiceData } from './types'

export function generateInvoiceEmailSubject(contractorName: string, weekLabel: string): string {
  return `${INVOICE_CONSTANTS.EMAIL.SUBJECT} - ${contractorName} - ${weekLabel}`
}

export function generateInvoiceEmailBody(invoiceData: InvoiceData): { text: string; html: string } {
  const {
    invoiceId,
    contractorName,
    weekLabel,
    hourlyRate,
    totalHours,
    totalAmount,
    entries,
    submittedAt
  } = invoiceData

  const text = `
New Worker Invoice Submitted

Invoice ID: ${invoiceId}
Worker: ${contractorName}
Week: ${weekLabel}
Hourly Rate: $${hourlyRate.toFixed(INVOICE_CONSTANTS.FORMATS.DECIMAL_PLACES)} ${INVOICE_CONSTANTS.FORMATS.CURRENCY}
Total Hours: ${totalHours.toFixed(INVOICE_CONSTANTS.FORMATS.DECIMAL_PLACES)}
Total Amount: $${totalAmount.toFixed(INVOICE_CONSTANTS.FORMATS.DECIMAL_PLACES)} ${INVOICE_CONSTANTS.FORMATS.CURRENCY}
Submitted: ${submittedAt}

Work Details:
${entries.map(entry =>
  `${entry.date} - ${entry.builderName} (${entry.companyCode}) - ${entry.locationLabel}
   Tonnage: ${entry.tonnageHours.toFixed(INVOICE_CONSTANTS.FORMATS.DECIMAL_PLACES)}h, Day Labour: ${entry.dayLabourHours.toFixed(INVOICE_CONSTANTS.FORMATS.DECIMAL_PLACES)}h, Total: ${entry.totalHours.toFixed(INVOICE_CONSTANTS.FORMATS.DECIMAL_PLACES)}h`
).join('\n\n')}

Please review and process this invoice.
  `.trim()

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
        New Worker Invoice Submitted
      </h2>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px 0; color: #333;">Invoice Summary</h3>
        <table style="width: 100%; border-spacing: 0;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 30%;">Invoice ID:</td>
            <td style="padding: 8px 0;">${invoiceId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Worker:</td>
            <td style="padding: 8px 0;">${contractorName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Week:</td>
            <td style="padding: 8px 0;">${weekLabel}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Hourly Rate:</td>
            <td style="padding: 8px 0;">$${hourlyRate.toFixed(INVOICE_CONSTANTS.FORMATS.DECIMAL_PLACES)} ${INVOICE_CONSTANTS.FORMATS.CURRENCY}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Total Hours:</td>
            <td style="padding: 8px 0;">${totalHours.toFixed(INVOICE_CONSTANTS.FORMATS.DECIMAL_PLACES)}</td>
          </tr>
          <tr style="border-top: 2px solid #0066cc;">
            <td style="padding: 12px 0; font-weight: bold; font-size: 1.1em;">Total Amount:</td>
            <td style="padding: 12px 0; font-weight: bold; font-size: 1.1em; color: #0066cc;">$${totalAmount.toFixed(INVOICE_CONSTANTS.FORMATS.DECIMAL_PLACES)} ${INVOICE_CONSTANTS.FORMATS.CURRENCY}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Submitted:</td>
            <td style="padding: 8px 0;">${submittedAt}</td>
          </tr>
        </table>
      </div>

      <div style="margin: 30px 0;">
        <h3 style="color: #333; margin-bottom: 15px;">Work Details</h3>
        <table style="width: 100%; border-collapse: collapse; background: white;">
          <thead>
            <tr style="background: #0066cc; color: white;">
              <th style="padding: 12px; text-align: left;">Date</th>
              <th style="padding: 12px; text-align: left;">Builder</th>
              <th style="padding: 12px; text-align: left;">Location</th>
              <th style="padding: 12px; text-align: right;">Tonnage</th>
              <th style="padding: 12px; text-align: right;">Day Labour</th>
              <th style="padding: 12px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${entries.map((entry, index) => `
              <tr style="border-bottom: 1px solid #eee; ${index % 2 === 0 ? 'background: #f8f9fa;' : ''}">
                <td style="padding: 10px;">${entry.date}</td>
                <td style="padding: 10px;">${entry.builderName}<br><small style="color: #666;">(${entry.companyCode})</small></td>
                <td style="padding: 10px;">${entry.locationLabel}</td>
                <td style="padding: 10px; text-align: right;">${entry.tonnageHours.toFixed(INVOICE_CONSTANTS.FORMATS.DECIMAL_PLACES)}h</td>
                <td style="padding: 10px; text-align: right;">${entry.dayLabourHours.toFixed(INVOICE_CONSTANTS.FORMATS.DECIMAL_PLACES)}h</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">${entry.totalHours.toFixed(INVOICE_CONSTANTS.FORMATS.DECIMAL_PLACES)}h</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin: 30px 0; padding: 20px; background: #e8f4fd; border-radius: 8px;">
        <p style="margin: 0; color: #333;">
          <strong>Next Steps:</strong> Please review and process this invoice through your payroll system.
        </p>
      </div>
    </div>
  `

  return { text, html }
}

export function formatInvoiceDate(date: Date): string {
  return format(date, INVOICE_CONSTANTS.FORMATS.DATE_FORMAT)
}