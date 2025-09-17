import puppeteer from 'puppeteer'
import { InvoiceData } from '@/modules/invoice/types'

export interface PDFGenerationOptions {
  invoiceData: InvoiceData
  outputPath?: string
}

export class PDFGenerator {
  /**
   * Generate a branded PDF invoice
   */
  static async generateInvoicePDF(options: PDFGenerationOptions): Promise<Buffer> {
    const { invoiceData } = options

    // Generate HTML template
    const htmlContent = this.generateInvoiceHTML(invoiceData)

    try {
      // Launch headless browser (you'll need to install puppeteer)
      // For now, we'll simulate PDF generation
      if (process.env.NODE_ENV === 'development' && !process.env.PUPPETEER_EXECUTABLE_PATH) {
        console.log('PDF Generation (Mock): Invoice PDF would be generated for:', invoiceData.contractorName)

        // Return a mock PDF buffer for development
        return Buffer.from(`Mock PDF for invoice ${invoiceData.invoiceId}`)
      }

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })

      const page = await browser.newPage()

      // Set content and generate PDF
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      })

      await browser.close()

      return Buffer.from(pdfBuffer)

    } catch (error) {
      console.error('PDF generation error:', error)
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate HTML template for the invoice
   */
  private static generateInvoiceHTML(data: InvoiceData): string {
    const {
      invoiceId,
      contractorName,
      contractorEmail,
      weekStart,
      weekEnd,
      weekLabel,
      hourlyRate,
      totalHours,
      totalAmount,
      entries,
      submittedAt
    } = data

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceId}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            background: white;
        }

        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
        }

        .company-info {
            flex: 1;
        }

        .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }

        .company-subtitle {
            font-size: 16px;
            color: #666;
            margin-bottom: 10px;
        }

        .invoice-info {
            text-align: right;
            flex: 1;
        }

        .invoice-title {
            font-size: 32px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
        }

        .invoice-meta {
            font-size: 14px;
            color: #666;
        }

        .contractor-section {
            margin-bottom: 30px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }

        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 15px;
        }

        .contractor-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        .detail-item {
            display: flex;
            justify-content: space-between;
        }

        .detail-label {
            font-weight: 600;
            color: #374151;
        }

        .detail-value {
            color: #6b7280;
        }

        .work-details {
            margin-bottom: 30px;
        }

        .work-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .work-table th {
            background: #2563eb;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #1d4ed8;
        }

        .work-table td {
            padding: 10px 8px;
            border: 1px solid #e5e7eb;
            background: white;
        }

        .work-table tr:nth-child(even) td {
            background: #f9fafb;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .summary-section {
            margin-top: 30px;
            border-top: 2px solid #e5e7eb;
            padding-top: 20px;
        }

        .summary-table {
            width: 100%;
            max-width: 400px;
            margin-left: auto;
        }

        .summary-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #e5e7eb;
        }

        .summary-total {
            font-size: 18px;
            font-weight: bold;
            background: #2563eb;
            color: white;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }

        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            background: #10b981;
            color: white;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                <div class="company-name">DoBi Steel Fixing Pty Ltd</div>
                <div class="company-subtitle">Professional Steel Fixing Services</div>
                <div style="color: #666; font-size: 12px; margin-top: 10px;">
                    ABN: 12 345 678 901<br>
                    Email: admin@dobisteelfixing.com.au<br>
                    Phone: (02) 1234 5678
                </div>
            </div>
            <div class="invoice-info">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-meta">
                    <strong>Invoice #:</strong> ${invoiceId}<br>
                    <strong>Date:</strong> ${submittedAt}<br>
                    <span class="status-badge">Submitted</span>
                </div>
            </div>
        </div>

        <!-- Contractor Information -->
        <div class="contractor-section">
            <div class="section-title">Contractor Details</div>
            <div class="contractor-details">
                <div class="detail-item">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${contractorName}</span>
                </div>
                ${contractorEmail ? `
                <div class="detail-item">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${contractorEmail}</span>
                </div>
                ` : ''}
                <div class="detail-item">
                    <span class="detail-label">Period:</span>
                    <span class="detail-value">${weekLabel}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Hourly Rate:</span>
                    <span class="detail-value">$${hourlyRate.toFixed(2)}/hr</span>
                </div>
            </div>
        </div>

        <!-- Work Details -->
        <div class="work-details">
            <div class="section-title">Work Summary</div>
            <table class="work-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Builder</th>
                        <th>Location</th>
                        <th class="text-right">Tonnage (hrs)</th>
                        <th class="text-right">Day Labour (hrs)</th>
                        <th class="text-right">Total (hrs)</th>
                    </tr>
                </thead>
                <tbody>
                    ${entries.map(entry => `
                    <tr>
                        <td>${entry.date}</td>
                        <td>
                            <strong>${entry.builderName}</strong><br>
                            <small style="color: #666;">${entry.companyCode}</small>
                        </td>
                        <td>${entry.locationLabel}</td>
                        <td class="text-right">${entry.tonnageHours.toFixed(2)}</td>
                        <td class="text-right">${entry.dayLabourHours.toFixed(2)}</td>
                        <td class="text-right"><strong>${entry.totalHours.toFixed(2)}</strong></td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Summary -->
        <div class="summary-section">
            <table class="summary-table">
                <tr>
                    <td><strong>Total Hours:</strong></td>
                    <td class="text-right">${totalHours.toFixed(2)} hrs</td>
                </tr>
                <tr>
                    <td><strong>Hourly Rate:</strong></td>
                    <td class="text-right">$${hourlyRate.toFixed(2)}</td>
                </tr>
                <tr class="summary-total">
                    <td><strong>TOTAL AMOUNT:</strong></td>
                    <td class="text-right"><strong>$${totalAmount.toFixed(2)}</strong></td>
                </tr>
            </table>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>This invoice was generated automatically on ${new Date().toLocaleDateString()}.</p>
            <p>Please retain this document for your records.</p>
        </div>
    </div>
</body>
</html>
    `
  }

  /**
   * Save PDF to file system (for development/storage)
   */
  static async savePDFToFile(pdfBuffer: Buffer, filePath: string): Promise<void> {
    const fs = await import('fs/promises')
    await fs.writeFile(filePath, pdfBuffer)
  }
}