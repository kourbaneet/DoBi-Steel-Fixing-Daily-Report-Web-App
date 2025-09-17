import crypto from 'crypto'

// Use AES-256-CBC for encryption (more widely supported)
const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16 // CBC requires 16 bytes IV

// Get encryption key from environment variable
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required')
  }

  // Convert hex string to buffer, or create hash if not hex
  if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
    return Buffer.from(key, 'hex')
  } else {
    // Create a 32-byte key from the provided string
    return crypto.createHash('sha256').update(key).digest()
  }
}

interface EncryptedData {
  encrypted: string
  iv: string
}

export function encryptSensitiveData(text: string): string {
  if (!text || text.trim() === '') {
    return ''
  }

  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const result: EncryptedData = {
      encrypted,
      iv: iv.toString('hex')
    }

    return Buffer.from(JSON.stringify(result)).toString('base64')
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt sensitive data')
  }
}

export function decryptSensitiveData(encryptedData: string): string {
  if (!encryptedData || encryptedData.trim() === '') {
    return ''
  }

  try {
    const key = getEncryptionKey()
    const data: EncryptedData = JSON.parse(Buffer.from(encryptedData, 'base64').toString('utf8'))

    const iv = Buffer.from(data.iv, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)

    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    // Return empty string instead of throwing to handle legacy unencrypted data
    return ''
  }
}

// Helper function to check if data appears to be encrypted
export function isEncrypted(data: string): boolean {
  if (!data) return false

  try {
    // Try to parse as base64 and then as JSON
    const decoded = Buffer.from(data, 'base64').toString('utf8')
    const parsed = JSON.parse(decoded)
    return typeof parsed === 'object' && 'encrypted' in parsed && 'iv' in parsed
  } catch {
    return false
  }
}

// Safe encryption that handles already encrypted data
export function safeEncrypt(text: string): string {
  if (!text || isEncrypted(text)) {
    return text
  }
  return encryptSensitiveData(text)
}

// Safe decryption that handles unencrypted data
export function safeDecrypt(text: string): string {
  if (!text) return ''

  if (isEncrypted(text)) {
    return decryptSensitiveData(text)
  }
  return text
}