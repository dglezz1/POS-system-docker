# 🚀 RAILWAY DEPLOY - Variables Esenciales

## ⚡ CONFIGURACIÓN RÁPIDA PARA RAILWAY

### 🔐 1. Variables de Seguridad (CRÍTICAS)
```bash
JWT_SECRET=tu-jwt-secret-super-seguro-de-32-caracteres-minimo
NEXTAUTH_SECRET=tu-nextauth-secret-diferente-de-32-caracteres
NODE_ENV=production
```

### 👤 2. Credenciales de Acceso Inicial
```bash
ADMIN_EMAIL=admin@tuempresa.com
ADMIN_PASSWORD=TuContraseñaSegura123!
COMPANY_NAME=Tu Panadería
```

### 🌐 3. Configuración del Servidor
```bash
HOSTNAME=0.0.0.0
PORT=3000
NEXT_TELEMETRY_DISABLED=1
```

### 🗄️ 4. Base de Datos
Railway creará automáticamente la variable `DATABASE_URL` cuando añadas PostgreSQL.

## 📋 CHECKLIST RAILWAY

- [ ] 1. Crear proyecto en Railway
- [ ] 2. Conectar repositorio GitHub: `dglezz1/POS-system-docker`
- [ ] 3. Seleccionar branch: `docker-ready`
- [ ] 4. Añadir servicio PostgreSQL
- [ ] 5. Configurar variables de entorno arriba
- [ ] 6. Generar secrets seguros para JWT_SECRET y NEXTAUTH_SECRET
- [ ] 7. Deployar
- [ ] 8. Acceder con las credenciales configuradas
- [ ] 9. Cambiar contraseña del administrador

## 🔧 Generar Secrets Seguros

```bash
# Generar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generar NEXTAUTH_SECRET  
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 🎯 URLs después del deploy

- **App**: `https://tu-app.up.railway.app`
- **Login**: `https://tu-app.up.railway.app/login`
- **Admin**: `https://tu-app.up.railway.app/admin`

## 🚨 Post-Deploy

1. Acceder con credenciales configuradas
2. **Cambiar contraseña** inmediatamente
3. Configurar información de empresa
4. Verificar funcionamiento completo