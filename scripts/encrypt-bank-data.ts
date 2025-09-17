import { ContractorService } from "@/modules/contractor/services"

async function encryptExistingBankData() {
  console.log('Starting migration to encrypt existing bank data...')

  try {
    const result = await ContractorService.encryptExistingBankData()
    console.log(`Migration completed successfully:`)
    console.log(`- Records encrypted: ${result.encrypted}`)
    console.log(`- Records skipped (already encrypted): ${result.skipped}`)

    if (result.encrypted > 0) {
      console.log('\n⚠️  IMPORTANT: Bank data has been encrypted in the database.')
      console.log('Make sure to keep your ENCRYPTION_KEY environment variable secure and backed up.')
      console.log('If you lose this key, encrypted bank data will be unrecoverable.')
    }
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  encryptExistingBankData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export default encryptExistingBankData