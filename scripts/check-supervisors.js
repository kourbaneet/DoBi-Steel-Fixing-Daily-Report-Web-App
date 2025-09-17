const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkSupervisors() {
  try {
    console.log('🔍 Checking Supervisor Data...\n')

    // Get all users with SUPERVISOR role
    const supervisors = await prisma.user.findMany({
      where: {
        role: 'SUPERVISOR'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    console.log('👥 Users with SUPERVISOR role:')
    console.table(supervisors)

    // Get all dockets and their supervisors
    const dockets = await prisma.docket.findMany({
      select: {
        id: true,
        date: true,
        supervisorId: true,
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      take: 10 // Just first 10 for testing
    })

    console.log('\n📋 Sample Dockets with Supervisors:')
    dockets.forEach(docket => {
      console.log(`Docket ${docket.id}: Supervisor = ${docket.supervisor?.name || 'NULL'} (${docket.supervisor?.email || 'No email'})`)
    })

    // Check for dockets with missing supervisor names
    const docketsWithNullSupervisorName = await prisma.docket.count({
      where: {
        supervisor: {
          name: null
        }
      }
    })

    console.log(`\n⚠️  Dockets with null supervisor names: ${docketsWithNullSupervisorName}`)

    // Check for orphaned dockets (supervisorId not matching any user)
    const totalDockets = await prisma.docket.count()
    console.log(`📊 Total dockets: ${totalDockets}`)

  } catch (error) {
    console.error('Error checking supervisors:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSupervisors()