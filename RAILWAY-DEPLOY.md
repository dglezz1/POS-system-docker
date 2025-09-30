# 🚀 Variables de Entorno para Railway - Sistema de Gestión de Panadería

## 📋 Variables Requeridas para el Despliegue

### 🔐 **SEGURIDAD (CRÍTICAS)**
```bash
# JWT Secret para autenticación - GENERAR UNA ÚNICA Y SEGURA
JWT_SECRET=tu-jwt-secret-super-seguro-256-bits-minimo

# Next Auth Secret para NextJS - GENERAR UNA ÚNICA Y SEGURA  
NEXTAUTH_SECRET=tu-nextauth-secret-super-seguro-para-railway

# Entorno de producción
NODE_ENV=production
```

### 🗄️ **BASE DE DATOS**
```bash
# Railway PostgreSQL URL (la proporcionará Railway automáticamente)
DATABASE_URL=postgresql://usuario:contraseña@host:puerto/nombre_bd

# O para SQLite en Railway (si prefieres SQLite)
DATABASE_URL=file:./production.db
```

### 🌐 **CONFIGURACIÓN DEL SERVIDOR**
```bash
# Puerto (Railway lo asigna automáticamente, pero por si acaso)
PORT=3000

# Hostname para Railway
HOSTNAME=0.0.0.0

# Deshabilitar telemetría de Next.js
NEXT_TELEMETRY_DISABLED=1
```

### 👤 **CREDENCIALES INICIALES DEL SISTEMA**
```bash
# Email del administrador inicial
ADMIN_EMAIL=admin@tuempresa.com

# Contraseña del administrador inicial (cambiar después del primer acceso)
ADMIN_PASSWORD=TuContraseñaSuperSegura123!

# Nombre de la empresa
COMPANY_NAME=Tu Panadería

# Email del empleado demo (opcional)
EMPLOYEE_EMAIL=empleado@tuempresa.com

# Contraseña del empleado demo (opcional)
EMPLOYEE_PASSWORD=EmpleadoDemo123!
```

### 🌍 **CONFIGURACIÓN REGIONAL**
```bash
# Zona horaria (México)
DEFAULT_TIMEZONE=America/Mexico_City

# Moneda
DEFAULT_CURRENCY=MXN

# Idioma
DEFAULT_LANGUAGE=es-MX
```

## 🔧 Configuración Step-by-Step en Railway

### Paso 1: Crear Servicio en Railway
1. Ve a [railway.app](https://railway.app)
2. Conecta tu repositorio GitHub: `dglezz1/POS-system-docker`
3. Selecciona la branch `docker-ready`

### Paso 2: Configurar Variables de Entorno
En el dashboard de Railway, ve a **Variables** y añade:

#### **Variables Críticas de Seguridad:**
```bash
JWT_SECRET=genera-un-secreto-de-al-menos-32-caracteres-aleatorios
NEXTAUTH_SECRET=otro-secreto-diferente-de-al-menos-32-caracteres
NODE_ENV=production
```

#### **Variables de Configuración:**
```bash
HOSTNAME=0.0.0.0
PORT=3000
NEXT_TELEMETRY_DISABLED=1
```

#### **Variables de Base de Datos:**
- Si usas **PostgreSQL** (recomendado): Railway creará automáticamente `DATABASE_URL`
- Si prefieres **SQLite**: `DATABASE_URL=file:./production.db`

#### **Variables del Sistema:**
```bash
ADMIN_EMAIL=admin@tuempresa.com
ADMIN_PASSWORD=CambiarEsto123!
COMPANY_NAME=Tu Panadería
DEFAULT_TIMEZONE=America/Mexico_City
DEFAULT_CURRENCY=MXN
DEFAULT_LANGUAGE=es-MX
```

### Paso 3: Configurar Base de Datos (Recomendado PostgreSQL)
1. En Railway, añade un servicio de **PostgreSQL**
2. Conecta la base de datos a tu aplicación
3. Railway generará automáticamente la variable `DATABASE_URL`

### Paso 4: Configurar Dockerfile para Railway
Railway detectará automáticamente el `Dockerfile` y lo construirá.

## 🔒 Generación de Secrets Seguros

### Generar JWT_SECRET y NEXTAUTH_SECRET:
```bash
# Opción 1: OpenSSL (Mac/Linux)
openssl rand -base64 32

# Opción 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Opción 3: Online (usar herramientas confiables)
# https://generate-random.org/api-key-generator
```

## ⚙️ Variables de Entorno Completas para Railway

```bash
# === SEGURIDAD ===
JWT_SECRET=tu-jwt-secret-generado-aqui
NEXTAUTH_SECRET=tu-nextauth-secret-generado-aqui
NODE_ENV=production

# === SERVIDOR ===
HOSTNAME=0.0.0.0
PORT=3000
NEXT_TELEMETRY_DISABLED=1

# === BASE DE DATOS ===
DATABASE_URL=postgresql://... # Railway lo genera automáticamente

# === SISTEMA ===
ADMIN_EMAIL=admin@tuempresa.com
ADMIN_PASSWORD=CambiarDespuesDelPrimerAcceso123!
COMPANY_NAME=Mi Panadería
DEFAULT_TIMEZONE=America/Mexico_City
DEFAULT_CURRENCY=MXN
DEFAULT_LANGUAGE=es-MX

# === OPCIONAL ===
EMPLOYEE_EMAIL=empleado@tuempresa.com
EMPLOYEE_PASSWORD=EmpleadoDemo123!
```

## 🚨 Importante - Seguridad

### ⚠️ **ANTES DE DESPLEGAR:**
1. **Generar secrets únicos** para `JWT_SECRET` y `NEXTAUTH_SECRET`
2. **Cambiar credenciales** por defecto de `ADMIN_PASSWORD`
3. **Usar PostgreSQL** en lugar de SQLite para producción
4. **Verificar** que todas las variables estén configuradas

### 🔐 **DESPUÉS DEL DESPLIEGUE:**
1. Acceder al sistema con las credenciales configuradas
2. **Cambiar inmediatamente** la contraseña del administrador
3. **Configurar** información de la empresa
4. **Eliminar** usuario empleado demo si no es necesario
5. **Configurar backup** de la base de datos

## 📞 Verificación del Despliegue

Una vez desplegado, tu aplicación estará disponible en:
- **URL**: `https://tu-app-name.up.railway.app`
- **Login**: `https://tu-app-name.up.railway.app/login`

### Health Check:
```bash
curl https://tu-app-name.up.railway.app/api/public/system-config
```

## 🛠️ Troubleshooting

### Si el despliegue falla:
1. Verificar que todas las variables requeridas estén configuradas
2. Revisar logs en Railway
3. Asegurarse de que la base de datos esté conectada
4. Verificar que los secrets sean válidos (sin caracteres especiales problemáticos)

### Si no puedes acceder:
1. Verificar `ADMIN_EMAIL` y `ADMIN_PASSWORD`
2. Revisar logs del contenedor
3. Verificar que la base de datos esté funcionando
4. Probar el endpoint de health check