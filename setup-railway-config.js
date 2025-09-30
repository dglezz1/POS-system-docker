#!/usr/bin/env node

/**
 * Script de configuración específico para Railway
 * Configura credenciales y sistema para entorno de producción Railway
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Función para generar UUID v4 usando crypto nativo
function generateUUID() {
  return crypto.randomUUID();
}

// Configuración desde variables de entorno de Railway
const RAILWAY_CONFIG = {
  admin: {
    name: 'Administrador del Sistema',
    email: process.env.ADMIN_EMAIL || 'admin@company.com',
    password: process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!',
    role: 'ADMIN'
  },
  employee: {
    name: 'Empleado Demo',
    email: process.env.EMPLOYEE_EMAIL || 'empleado@company.com',
    password: process.env.EMPLOYEE_PASSWORD || 'Employee123!',
    role: 'EMPLOYEE'
  },
  company: {
    name: process.env.COMPANY_NAME || 'Mi Panadería',
    timezone: process.env.DEFAULT_TIMEZONE || 'America/Mexico_City',
    currency: process.env.DEFAULT_CURRENCY || 'MXN',
    language: process.env.DEFAULT_LANGUAGE || 'es'
  }
};

async function setupRailwayCredentials() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Configurando sistema para Railway...');
    console.log(`🏢 Empresa: ${RAILWAY_CONFIG.company.name}`);
    console.log(`👑 Admin: ${RAILWAY_CONFIG.admin.email}`);
    
    // Verificar si ya existe un usuario administrador
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    let adminUser;

    if (existingAdmin) {
      console.log('✅ Usuario administrador ya existe:', existingAdmin.email);
      adminUser = existingAdmin;
    } else {
      // Crear usuario administrador
      const hashedAdminPassword = await bcrypt.hash(RAILWAY_CONFIG.admin.password, 12);
      adminUser = await prisma.user.create({
        data: {
          id: generateUUID(),
          name: RAILWAY_CONFIG.admin.name,
          email: RAILWAY_CONFIG.admin.email,
          password: hashedAdminPassword,
          role: RAILWAY_CONFIG.admin.role,
          isActive: true
        }
      });

      console.log('✅ Usuario administrador creado:', adminUser.email);
    }

    // Solo crear empleado demo si está configurado y no existe
    if (process.env.EMPLOYEE_EMAIL) {
      const existingEmployee = await prisma.user.findFirst({
        where: { email: RAILWAY_CONFIG.employee.email }
      });

      if (!existingEmployee) {
        const hashedEmployeePassword = await bcrypt.hash(RAILWAY_CONFIG.employee.password, 12);
        const employeeUser = await prisma.user.create({
          data: {
            id: generateUUID(),
            name: RAILWAY_CONFIG.employee.name,
            email: RAILWAY_CONFIG.employee.email,
            password: hashedEmployeePassword,
            role: RAILWAY_CONFIG.employee.role,
            isActive: true
          }
        });

        console.log('✅ Usuario empleado creado:', employeeUser.email);
      }
    }

    // Crear configuraciones básicas del sistema
    const systemConfigs = [
      { key: 'COMPANY_NAME', value: RAILWAY_CONFIG.company.name, category: 'company' },
      { key: 'COMPANY_TIMEZONE', value: RAILWAY_CONFIG.company.timezone, category: 'system' },
      { key: 'COMPANY_CURRENCY', value: RAILWAY_CONFIG.company.currency, category: 'company' },
      { key: 'COMPANY_LANGUAGE', value: RAILWAY_CONFIG.company.language, category: 'system' },
      { key: 'SYSTEM_INITIALIZED', value: 'true', category: 'system' },
      { key: 'RAILWAY_DEPLOY', value: 'true', category: 'system' },
      { key: 'DEPLOY_TIMESTAMP', value: new Date().toISOString(), category: 'system' }
    ];

    for (const config of systemConfigs) {
      await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: { value: config.value },
        create: {
          id: generateUUID(),
          key: config.key,
          value: config.value,
          category: config.category,
          description: `Configuración Railway: ${config.key}`,
          createdBy: adminUser.id
        }
      });
    }

    console.log('✅ Configuraciones del sistema creadas/actualizadas');

    // Mostrar información de acceso para Railway
    console.log('\n🎉 ¡Sistema configurado exitosamente para Railway!');
    console.log('\n📋 INFORMACIÓN DE ACCESO:');
    console.log('========================================');
    console.log('👑 ADMINISTRADOR:');
    console.log(`   Email: ${RAILWAY_CONFIG.admin.email}`);
    console.log(`   Contraseña: ${RAILWAY_CONFIG.admin.password}`);
    
    if (process.env.EMPLOYEE_EMAIL) {
      console.log('\n👤 EMPLEADO DEMO:');
      console.log(`   Email: ${RAILWAY_CONFIG.employee.email}`);
      console.log(`   Contraseña: ${RAILWAY_CONFIG.employee.password}`);
    }
    
    console.log('========================================');
    console.log('\n🏢 CONFIGURACIÓN DE EMPRESA:');
    console.log(`   Nombre: ${RAILWAY_CONFIG.company.name}`);
    console.log(`   Zona Horaria: ${RAILWAY_CONFIG.company.timezone}`);
    console.log(`   Moneda: ${RAILWAY_CONFIG.company.currency}`);
    console.log(`   Idioma: ${RAILWAY_CONFIG.company.language}`);
    console.log('========================================');
    console.log('\n⚠️  IMPORTANTE: Cambiar contraseñas después del primer acceso');
    console.log('🌐 La aplicación estará disponible en la URL de Railway');

  } catch (error) {
    console.error('❌ Error configurando sistema para Railway:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  setupRailwayCredentials()
    .then(() => {
      console.log('✅ Configuración Railway completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en configuración Railway:', error);
      process.exit(1);
    });
}

module.exports = { setupRailwayCredentials, RAILWAY_CONFIG };