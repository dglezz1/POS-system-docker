import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addScheduleConfigurations() {
  try {
    // Buscar un usuario admin existente
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      console.error('❌ No se encontró un usuario admin')
      return
    }

    // Configuración para permitir a empleados editar sus horarios
    await prisma.systemConfig.upsert({
      where: { key: 'employees_can_edit_schedule' },
      create: {
        key: 'employees_can_edit_schedule',
        value: 'false',
        dataType: 'boolean',
        description: 'Permite a los empleados editar sus propios horarios',
        category: 'SCHEDULE',
        updatedBy: adminUser.id
      },
      update: {
        description: 'Permite a los empleados editar sus propios horarios',
        category: 'SCHEDULE'
      }
    })

    // Configuración para roles que pueden editar horarios
    await prisma.systemConfig.upsert({
      where: { key: 'schedule_edit_roles' },
      create: {
        key: 'schedule_edit_roles',
        value: 'ADMIN',
        dataType: 'string',
        description: 'Roles que pueden editar horarios (separados por coma)',
        category: 'SCHEDULE',
        updatedBy: adminUser.id
      },
      update: {
        description: 'Roles que pueden editar horarios (separados por coma)',
        category: 'SCHEDULE'
      }
    })

    console.log('✅ Configuraciones de horarios agregadas correctamente')
  } catch (error) {
    console.error('❌ Error al agregar configuraciones:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addScheduleConfigurations()