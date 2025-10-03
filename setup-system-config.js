const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createInitialSystemConfig() {
  try {
    console.log('🔧 Creando configuración inicial del sistema...');

    // Primero, buscar un usuario ADMIN
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('⚠️  No se encontró un usuario ADMIN. Creando uno...');
      
      const bcrypt = require('bcryptjs');
      // Generar contraseña segura para producción
      const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!';
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@company.com';
      
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const newAdmin = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Administrador del Sistema',
          role: 'ADMIN',
          password: hashedPassword,
          isActive: true
        }
      });
      
      console.log('✅ Usuario ADMIN creado:', newAdmin.email);
    } else {
      console.log('✅ Usuario ADMIN encontrado:', adminUser.email);
    }

    // Configuraciones por defecto
    const configs = [
      { key: 'systemName', value: 'Mi Panadería', dataType: 'string', category: 'general', description: 'Nombre del sistema' },
      { key: 'currency', value: 'COP', dataType: 'string', category: 'financial', description: 'Moneda del sistema' },
      { key: 'taxRate', value: '0.19', dataType: 'number', category: 'financial', description: 'Tasa de impuesto' },
      { key: 'timezone', value: 'America/Bogota', dataType: 'string', category: 'general', description: 'Zona horaria' },
      { key: 'dateFormat', value: 'DD/MM/YYYY', dataType: 'string', category: 'general', description: 'Formato de fecha' },
      { key: 'theme', value: 'light', dataType: 'string', category: 'appearance', description: 'Tema del sistema' },
      { key: 'primaryColor', value: '#3B82F6', dataType: 'string', category: 'appearance', description: 'Color primario' },
      { key: 'language', value: 'es', dataType: 'string', category: 'general', description: 'Idioma del sistema' },
      { key: 'enableNotifications', value: 'true', dataType: 'boolean', category: 'notifications', description: 'Habilitar notificaciones' },
      { key: 'emailNotifications', value: 'true', dataType: 'boolean', category: 'notifications', description: 'Notificaciones por email' },
      { key: 'lowStockThreshold', value: '10', dataType: 'number', category: 'inventory', description: 'Umbral de stock bajo' },
      { key: 'enableCakeBar', value: 'true', dataType: 'boolean', category: 'features', description: 'Habilitar Cake Bar' },
      { key: 'enableCustomOrders', value: 'true', dataType: 'boolean', category: 'features', description: 'Habilitar pedidos personalizados' },
      { key: 'maxCakeBarOptions', value: '50', dataType: 'number', category: 'features', description: 'Máximo opciones Cake Bar' },
      { key: 'defaultPaymentMethod', value: 'EFECTIVO', dataType: 'string', category: 'sales', description: 'Método de pago por defecto' },
      { key: 'allowPartialPayments', value: 'true', dataType: 'boolean', category: 'sales', description: 'Permitir pagos parciales' },
      { key: 'requireEmployeeClockIn', value: 'true', dataType: 'boolean', category: 'staff', description: 'Requerir marcado de empleados' },
      { key: 'maxWorkHours', value: '8', dataType: 'number', category: 'staff', description: 'Máximo horas de trabajo' },
      { key: 'breakDuration', value: '30', dataType: 'number', category: 'staff', description: 'Duración del descanso (minutos)' },
      { key: 'passwordMinLength', value: '6', dataType: 'number', category: 'security', description: 'Longitud mínima de contraseña' },
      { key: 'sessionTimeout', value: '480', dataType: 'number', category: 'security', description: 'Tiempo de sesión (minutos)' },
      { key: 'enableTwoFactor', value: 'false', dataType: 'boolean', category: 'security', description: 'Habilitar autenticación de dos factores' },
      { key: 'backupFrequency', value: 'daily', dataType: 'string', category: 'system', description: 'Frecuencia de respaldo' },
      { key: 'maintenanceMode', value: 'false', dataType: 'boolean', category: 'system', description: 'Modo mantenimiento' }
    ];

    const updatedBy = adminUser?.id || (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))?.id;

    for (const config of configs) {
      await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: {
          value: config.value,
          updatedBy: updatedBy
        },
        create: {
          key: config.key,
          value: config.value,
          dataType: config.dataType,
          description: config.description,
          category: config.category,
          updatedBy: updatedBy
        }
      });
    }

    console.log('✅ Configuración inicial del sistema creada exitosamente');

    // Crear categoría por defecto "Sin Categoría"
    console.log('📂 Creando categoría por defecto...');
    await prisma.category.upsert({
      where: { 
        name_type: {
          name: 'Sin Categoría',
          type: 'VITRINA'
        }
      },
      update: {},
      create: {
        id: 'default-category-vitrina',
        name: 'Sin Categoría',
        color: '#6B7280',
        type: 'VITRINA',
        isActive: true,
        sortOrder: 0,
        createdBy: updatedBy
      }
    });

    // También crear para CAKE_BAR
    await prisma.category.upsert({
      where: {
        name_type: {
          name: 'Sin Categoría',
          type: 'CAKE_BAR'
        }
      },
      update: {},
      create: {
        id: 'default-category-cakebar',
        name: 'Sin Categoría', 
        color: '#6B7280',
        type: 'CAKE_BAR',
        isActive: true,
        sortOrder: 0,
        createdBy: updatedBy
      }
    });

    console.log('✅ Categorías por defecto creadas');
    
    // Mostrar configuración creada
    const allConfigs = await prisma.systemConfig.findMany();
    console.log(`📊 Total de configuraciones: ${allConfigs.length}`);
    
    console.log('🎉 ¡Configuración del sistema lista!');
    console.log('');
    console.log('Puedes acceder a:');
    console.log('- Panel de configuración: /admin/system-config');
    console.log('- Login como admin: Configurado con variables de entorno');

  } catch (error) {
    console.error('❌ Error al crear configuración inicial:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createInitialSystemConfig();