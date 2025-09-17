const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixSupervisorNames() {
  try {
    console.log('🔧 Fixing Supervisor Names...\n')

    // Find supervisors with null names
    const supervisorsWithoutNames = await prisma.user.findMany({
      where: {
        role: 'SUPERVISOR',
        name: null
      }
    })

    console.log(`Found ${supervisorsWithoutNames.length} supervisors without names:`)
    supervisorsWithoutNames.forEach(sup => {
      console.log(`- ID: ${sup.id}, Email: ${sup.email}`)
    })

    // Update each supervisor with a default name based on email
    for (const supervisor of supervisorsWithoutNames) {
      const defaultName = supervisor.email
        ? supervisor.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : 'Supervisor'

      await prisma.user.update({
        where: { id: supervisor.id },
        data: { name: defaultName }
      })

      console.log(`✅ Updated supervisor ${supervisor.id}: name = "${defaultName}"`)
    }

    console.log('\n🎉 All supervisor names have been updated!')

    // Verify the changes
    const updatedSupervisors = await prisma.user.findMany({
      where: {
        role: 'SUPERVISOR'
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    console.log('\n📋 Updated Supervisors:')
    console.table(updatedSupervisors)

  } catch (error) {
    console.error('Error fixing supervisor names:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixSupervisorNames()