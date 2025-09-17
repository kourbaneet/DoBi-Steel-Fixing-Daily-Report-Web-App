import { promises as fs } from 'fs'
import path from 'path'

export class FileStorage {
  private static readonly UPLOAD_DIR = 'public/uploads/invoices'

  /**
   * Initialize upload directory
   */
  static async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.UPLOAD_DIR)
    } catch {
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true })
    }
  }

  /**
   * Save PDF file and return public URL
   */
  static async savePDF(pdfBuffer: Buffer, filename: string): Promise<string> {
    await this.ensureUploadDir()

    const filepath = path.join(this.UPLOAD_DIR, filename)
    await fs.writeFile(filepath, pdfBuffer)

    // Return public URL (accessible via /uploads/invoices/filename)
    return `/uploads/invoices/${filename}`
  }

  /**
   * Generate unique filename for PDF
   */
  static generatePDFFilename(invoiceId: string, contractorName: string): string {
    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const safeName = contractorName.replace(/[^a-zA-Z0-9]/g, '_')
    return `invoice_${invoiceId}_${safeName}_${timestamp}.pdf`
  }

  /**
   * Delete PDF file
   */
  static async deletePDF(pdfUrl: string): Promise<void> {
    try {
      // Convert public URL back to file path
      const filename = path.basename(pdfUrl)
      const filepath = path.join(this.UPLOAD_DIR, filename)
      await fs.unlink(filepath)
    } catch (error) {
      console.error('Error deleting PDF:', error)
      // Don't throw - file deletion is not critical
    }
  }

  /**
   * Check if PDF file exists
   */
  static async pdfExists(pdfUrl: string): Promise<boolean> {
    try {
      const filename = path.basename(pdfUrl)
      const filepath = path.join(this.UPLOAD_DIR, filename)
      await fs.access(filepath)
      return true
    } catch {
      return false
    }
  }
}