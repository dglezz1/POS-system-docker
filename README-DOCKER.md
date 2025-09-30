# 🍰 Sistema de Gestión de Panadería - Docker

Sistema completo de gestión para panaderías y pastelerías con POS, inventario y administración.

## 🚀 Inicio Rápido con Docker

### Prerrequisitos
- Docker y Docker Compose instalados
- Puerto 3000 disponible

### 🔧 Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd Gestion-Pre-production
```

2. **Construir y ejecutar con Docker**
```bash
docker-compose up --build -d
```

3. **Acceder al sistema**
- URL: http://localhost:3000
- **Credenciales por defecto:**
  - **Email**: `admin@company.com`
  - **Contraseña**: `ChangeThisPassword123!`

### 📊 Estado del servicio
```bash
# Ver logs
docker-compose logs -f

# Verificar estado
docker-compose ps

# Detener el servicio
docker-compose down

# Detener y eliminar volúmenes (CUIDADO: elimina datos)
docker-compose down -v
```

## 🔒 Seguridad Inicial

⚠️ **IMPORTANTE**: Cambiar las credenciales por defecto después del primer acceso:

1. Acceder con las credenciales por defecto
2. Ir a **Panel Admin** → **Configuración del Sistema**
3. Cambiar:
   - Email del administrador
   - Contraseña del administrador
   - Información de la empresa
   - Configuración regional

## 🏗️ Arquitectura del Sistema

### Módulos Principales
- **🛒 POS Vitrina**: Productos tradicionales (panes, galletas, pasteles)
- **🎂 POS Cake Bar**: Pasteles personalizados con opciones limitadas
- **📝 Pedidos Personalizados**: Cotización dinámica para pedidos especiales
- **📦 Gestión de Inventario**: Productos, categorías, ingredientes y stock
- **📊 Panel Administrativo**: Reportes, caja y gestión general
- **👥 Gestión de Personal**: Control de empleados y horarios

### Configuración por Defecto
- **Zona Horaria**: Ciudad de México (GMT-6)
- **Moneda**: Peso Mexicano (MXN)
- **Idioma**: Español (México)
- **Impuestos**: Configurable (por defecto 16%)

## � Credenciales Automáticas

El sistema configura automáticamente las credenciales durante el primer inicio:

### 👑 Administrador del Sistema
- **Email**: `admin@company.com`
- **Contraseña**: `ChangeThisPassword123!`
- **Permisos**: Acceso completo, configuración y administración

### 👤 Empleado Demostración
- **Email**: `empleado@company.com`
- **Contraseña**: `Employee123!`
- **Permisos**: POS, ventas y funciones operativas

⚠️ **IMPORTANTE**: Cambiar estas contraseñas después del primer acceso

## 🔧 Variables de Entorno

Las variables de sistema se configuran automáticamente en `.env.docker`:

# Base de datos
DATABASE_URL=file:/app/data/production.db

# Seguridad (CAMBIAR en producción)
JWT_SECRET=pastry-management-jwt-secret-2024-change-in-production
NEXTAUTH_SECRET=nextauth-secret-for-pastry-management-2024

# Configuración regional
DEFAULT_TIMEZONE=America/Mexico_City
DEFAULT_CURRENCY=MXN
DEFAULT_LANGUAGE=es-MX
```

## 📁 Volúmenes de Docker

- **`bakery-data`**: Base de datos y archivos de configuración
- **`bakery-uploads`**: Logos, imágenes y archivos subidos

## 🛠️ Desarrollo Local

Para desarrollo sin Docker:

1. **Instalar dependencias**
```bash
npm install
```

2. **Configurar base de datos**
```bash
npx prisma generate
npx prisma db push
node setup-system-config.js
```

3. **Ejecutar en desarrollo**
```bash
npm run dev
```

## 📋 Funcionalidades Principales

### 🏪 Punto de Venta
- Venta rápida con códigos de barras
- Múltiples métodos de pago (efectivo, tarjeta, transferencia)
- Impresión de tickets
- Control de caja integrado

### 📊 Administración
- Dashboard ejecutivo con métricas en tiempo real
- Control de caja y cierre diario
- Reportes de ventas por período
- Gestión de usuarios y permisos

### 📦 Inventario
- Gestión de productos y categorías
- Control de stock con alertas
- Gestión de ingredientes y recetas
- Trazabilidad completa

### 👥 Personal
- Control de horarios y jornadas
- Check-in/check-out de empleados
- Gestión de permisos y roles
- Reportes de productividad

## 🆘 Solución de Problemas

### Puerto ocupado
```bash
# Verificar qué usa el puerto 3000
lsof -i :3000

# Cambiar puerto en docker-compose.yml
ports:
  - "3001:3000"  # Usa puerto 3001 externamente
```

### Problemas de permisos
```bash
# Dar permisos a los volúmenes
sudo chown -R $USER:$USER ./data
```

### Reiniciar base de datos
```bash
# Detener servicios
docker-compose down

# Eliminar volúmenes (CUIDADO: elimina todos los datos)
docker volume rm gestion-pre-production_bakery-data

# Volver a construir
docker-compose up --build -d
```

## 📞 Soporte

- **Email de soporte**: Configurar en el sistema
- **Documentación**: Disponible en `/admin/system-config`
- **Logs del sistema**: `docker-compose logs -f`

---

**⚠️ Recordatorio**: Cambiar todas las credenciales por defecto antes de usar en producción.