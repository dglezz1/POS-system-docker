# Guía de Despliegue para Producción

## Sistema de Gestión de Panadería

### Prerrequisitos

- Docker y Docker Compose instalados
- Puerto 3000 disponible
- Credenciales de administrador seguras configuradas

### Despliegue con Docker

#### 1. Preparar Variables de Entorno

Cree un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

**IMPORTANTE**: Modifique las siguientes variables para producción:

```bash
# Credenciales de administrador (CAMBIAR OBLIGATORIO)
ADMIN_EMAIL="tu-email@empresa.com"
ADMIN_PASSWORD="TuPasswordSeguro123!"

# Secrets de seguridad (GENERAR NUEVOS)
JWT_SECRET="tu-secret-jwt-muy-largo-y-seguro"
NEXTAUTH_SECRET="tu-secret-nextauth-muy-largo-y-seguro"

# Configuración de producción
NODE_ENV="production"
DATABASE_URL="file:/app/data/production.db"
```

#### 2. Construir y Ejecutar

```bash
# Construir la imagen
docker-compose build

# Ejecutar en segundo plano
docker-compose up -d
```

#### 3. Verificar el Despliegue

```bash
# Ver logs
docker-compose logs -f

# Verificar estado
docker-compose ps

# Verificar salud de la aplicación
curl http://localhost:3000/api/public/system-config
```

### Configuración Inicial

1. **Acceso al Sistema**: 
   - URL: `http://localhost:3000`
   - Email: El configurado en `ADMIN_EMAIL`
   - Password: El configurado en `ADMIN_PASSWORD`

2. **Configuración del Sistema**:
   - Vaya a `/admin/system-config`
   - Configure el nombre de su empresa, logo y colores
   - Ajuste las configuraciones según sus necesidades

### Seguridad en Producción

✅ **Implementado**:
- Eliminación de credenciales demo
- Autenticación JWT segura
- Variables de entorno para credenciales
- Usuario no-root en contenedor
- Healthchecks configurados

🔒 **Recomendaciones Adicionales**:
- Use un proxy reverso (nginx) con HTTPS
- Configure backup automático de la base de datos
- Implemente monitoreo y logs centralizados
- Use secretos de Docker en lugar de variables de entorno para datos sensibles

### Comandos Útiles

```bash
# Detener servicios
docker-compose down

# Ver logs en vivo
docker-compose logs -f bakery-app

# Backup de datos
docker cp $(docker-compose ps -q bakery-app):/app/data/production.db ./backup-$(date +%Y%m%d).db

# Acceder al contenedor
docker-compose exec bakery-app sh

# Restart servicios
docker-compose restart
```

### Troubleshooting

#### Error de conexión a base de datos
```bash
docker-compose exec bakery-app npx prisma migrate status
```

#### Verificar configuración
```bash
docker-compose exec bakery-app node -e "console.log(process.env.ADMIN_EMAIL)"
```

#### Regenerar configuración inicial
```bash
docker-compose exec bakery-app node setup-system-config.js
```

### Actualizaciones

1. Detenga los servicios: `docker-compose down`
2. Actualice el código
3. Reconstruya: `docker-compose build --no-cache`
4. Inicie: `docker-compose up -d`

### Soporte

Para problemas de despliegue, revise:
1. Los logs con `docker-compose logs`
2. Las variables de entorno en `.env`
3. La conectividad de red y puertos
4. Los volúmenes de datos persistentes