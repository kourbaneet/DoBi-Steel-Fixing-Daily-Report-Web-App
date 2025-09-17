import { PRISMA } from "@/libs/prisma"
import { encryptSensitiveData, decryptSensitiveData, safeEncrypt, safeDecrypt } from "@/libs/encryption"
import { CreateContractorInput, UpdateContractorInput } from "./validations"
import { Prisma } from "@prisma/client"

// Bank information fields that need encryption
const BANK_FIELDS = ['bankName', 'bsb', 'accountNo'] as const

type BankField = typeof BANK_FIELDS[number]

// Helper to encrypt bank data in contractor input
function encryptBankData<T extends Partial<Record<BankField, string | undefined>>>(data: T): T {
  const result = { ...data }

  BANK_FIELDS.forEach(field => {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = safeEncrypt(result[field] as string) as T[typeof field]
    }
  })

  return result
}

// Helper to decrypt bank data in contractor output
function decryptBankData<T extends Partial<Record<BankField, string | null>>>(data: T): T {
  const result = { ...data }

  BANK_FIELDS.forEach(field => {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = safeDecrypt(result[field] as string) as T[typeof field]
    }
  })

  return result
}

export class ContractorService {
  static async create(data: CreateContractorInput) {
    // Encrypt bank information before storing
    const encryptedData = encryptBankData(data)

    return await PRISMA.contractor.create({
      data: {
        ...encryptedData,
        email: encryptedData.email || null,
      },
      include: {
        user: true,
      },
    })
  }

  static async update(id: string, data: Omit<UpdateContractorInput, 'id'>) {
    // Encrypt bank information before updating
    const encryptedData = encryptBankData(data)

    return await PRISMA.contractor.update({
      where: { id },
      data: encryptedData,
      include: {
        user: true,
      },
    })
  }

  static async findById(id: string) {
    const contractor = await PRISMA.contractor.findUnique({
      where: { id },
      include: {
        user: true,
      },
    })

    if (!contractor) {
      return null
    }

    // Decrypt bank information for display
    return decryptBankData(contractor)
  }

  static async findByIdWithoutBankInfo(id: string) {
    return await PRISMA.contractor.findUnique({
      where: { id },
      select: {
        id: true,
        nickname: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        phone: true,
        position: true,
        hourlyRate: true,
        abn: true,
        homeAddress: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        user: true,
      },
    })
  }

  static async findMany(params: {
    where?: Prisma.ContractorWhereInput
    orderBy?: Prisma.ContractorOrderByWithRelationInput
    skip?: number
    take?: number
    includeBankInfo?: boolean
  }) {
    const { where, orderBy, skip, take, includeBankInfo = false } = params

    if (includeBankInfo) {
      // For admin operations where bank info is needed, decrypt after retrieval
      const contractors = await PRISMA.contractor.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          user: true,
        },
      })

      return contractors.map(contractor => decryptBankData(contractor))
    } else {
      // For general listing, exclude bank information entirely
      return await PRISMA.contractor.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          nickname: true,
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
          phone: true,
          position: true,
          hourlyRate: true,
          abn: true,
          homeAddress: true,
          active: true,
          createdAt: true,
          updatedAt: true,
          user: true,
        },
      })
    }
  }

  static async count(where?: Prisma.ContractorWhereInput) {
    return await PRISMA.contractor.count({ where })
  }

  static async delete(id: string) {
    return await PRISMA.contractor.delete({
      where: { id },
    })
  }

  static async findByNickname(nickname: string) {
    return await PRISMA.contractor.findUnique({
      where: { nickname },
    })
  }

  static async findByEmail(email: string) {
    return await PRISMA.contractor.findUnique({
      where: { email },
    })
  }

  // Migration helper: encrypt existing unencrypted bank data
  static async encryptExistingBankData() {
    console.log('Starting bank data encryption migration...')

    const contractors = await PRISMA.contractor.findMany({
      select: {
        id: true,
        bankName: true,
        bsb: true,
        accountNo: true,
      },
    })

    let encrypted = 0
    let skipped = 0

    for (const contractor of contractors) {
      const updates: Partial<Pick<typeof contractor, 'bankName' | 'bsb' | 'accountNo'>> = {}
      let hasUpdates = false

      BANK_FIELDS.forEach(field => {
        const value = contractor[field]
        if (value && typeof value === 'string' && value.trim() !== '') {
          try {
            // Try to decrypt - if it fails, it's probably not encrypted
            safeDecrypt(value)
            // If decryption succeeds without error, it's already encrypted
            skipped++
          } catch {
            // If decryption fails, encrypt it
            updates[field] = safeEncrypt(value)
            hasUpdates = true
          }
        }
      })

      if (hasUpdates) {
        await PRISMA.contractor.update({
          where: { id: contractor.id },
          data: updates,
        })
        encrypted++
      }
    }

    console.log(`Bank data encryption migration completed. Encrypted: ${encrypted}, Skipped: ${skipped}`)
    return { encrypted, skipped }
  }
}