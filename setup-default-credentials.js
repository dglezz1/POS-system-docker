#!/usr/bin/env node

/**
 * Script para configurar credenciales por defecto en producción
 * Se ejecuta durante el build de Docker para crear usuario administrador
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Función para generar UUID v4 usando crypto nativo
function generateUUID() {
  return crypto.randomUUID();
}

// Configuración por defecto para producción
const DEFAULT_CONFIG = {
  admin: {
    name: 'Administrador del Sistema',
    email: 'admin@company.com',
    password: 'ChangeThisPassword123!',
    role: 'ADMIN'
  },
  employee: {
    name: 'Empleado Demo',
    email: 'empleado@company.com', 
    password: 'Employee123!',
    role: 'EMPLOYEE'
  },
  company: {
    name: 'Mi Panadería',
    timezone: 'America/Mexico_City',
    currency: 'MXN',
    language: 'es'
  }
};

async function setupDefaultCredentials() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Configurando credenciales por defecto...');
    
    // Verificar si ya existe un usuario administrador
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('✅ Usuario administrador ya existe:', existingAdmin.email);
      return;
    }

    // Crear usuario administrador
    const hashedAdminPassword = await bcrypt.hash(DEFAULT_CONFIG.admin.password, 12);
    const adminUser = await prisma.user.create({
      data: {
        id: generateUUID(),
        name: DEFAULT_CONFIG.admin.name,
        email: DEFAULT_CONFIG.admin.email,
        password: hashedAdminPassword,
        role: DEFAULT_CONFIG.admin.role,
        isActive: true
      }
    });

    console.log('✅ Usuario administrador creado:', adminUser.email);

    // Crear usuario empleado de ejemplo
    const hashedEmployeePassword = await bcrypt.hash(DEFAULT_CONFIG.employee.password, 12);
    const employeeUser = await prisma.user.create({
      data: {
        id: generateUUID(),
        name: DEFAULT_CONFIG.employee.name,
        email: DEFAULT_CONFIG.employee.email,
        password: hashedEmployeePassword,
        role: DEFAULT_CONFIG.employee.role,
        isActive: true
      }
    });

    console.log('✅ Usuario empleado creado:', employeeUser.email);

    // Crear configuraciones básicas del sistema si no existen
    const systemConfigs = [
      { key: 'COMPANY_NAME', value: DEFAULT_CONFIG.company.name, category: 'company' },
      { key: 'COMPANY_TIMEZONE', value: DEFAULT_CONFIG.company.timezone, category: 'system' },
      { key: 'COMPANY_CURRENCY', value: DEFAULT_CONFIG.company.currency, category: 'company' },
      { key: 'COMPANY_LANGUAGE', value: DEFAULT_CONFIG.company.language, category: 'system' },
      { key: 'SYSTEM_INITIALIZED', value: 'true', category: 'system' }
    ];

    for (const config of systemConfigs) {
      await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: {},
        create: {
          id: generateUUID(),
          key: config.key,
          value: config.value,
          category: config.category,
          description: `Configuración automática: ${config.key}`,
          createdBy: adminUser.id
        }
      });
    }

    console.log('✅ Configuraciones del sistema creadas');

    // Mostrar información de acceso
    console.log('\n🎉 ¡Sistema configurado exitosamente!');
    console.log('\n📋 CREDENCIALES DE ACCESO:');
    console.log('========================================');
    console.log('👑 ADMINISTRADOR:');
    console.log(`   Email: ${DEFAULT_CONFIG.admin.email}`);
    console.log(`   Contraseña: ${DEFAULT_CONFIG.admin.password}`);
    console.log('\n👤 EMPLEADO DEMO:');
    console.log(`   Email: ${DEFAULT_CONFIG.employee.email}`);
    console.log(`   Contraseña: ${DEFAULT_CONFIG.employee.password}`);
    console.log('========================================');
    console.log('\n⚠️  IMPORTANTE: Cambie estas contraseñas después del primer acceso');
    console.log('📱 Acceso: http://localhost:3000/login');

  } catch (error) {
    console.error('❌ Error configurando credenciales:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  setupDefaultCredentials()
    .then(() => {
      console.log('✅ Configuración completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en configuración:', error);
      process.exit(1);
    });
}

module.exports = { setupDefaultCredentials, DEFAULT_CONFIG };