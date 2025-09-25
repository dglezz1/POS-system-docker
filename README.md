# Sistema de Gestión de Pastelería

Sistema completo para la gestión de una pastelería que incluye inventario, punto de venta, cake bar, pedidos personalizados y panel administrativo con cierre de caja unificado.

## 🌟 Características Principales

### 📦 Gestión de Inventario
- **Ingredientes y Materias Primas**: Control de stock con alertas de stock mínimo
- **Productos por Categorías**: Organización de productos de vitrina y cake bar
- **Costeo Automático**: Cálculo de costos basado en ingredientes

### 🛒 Punto de Venta (POS)

#### Vitrina (Productos Tradicionales)
- Venta de galletas, pasteles, panes y productos tradicionales
- Gestión de stock en tiempo real
- Categorización de productos

#### Cake Bar (Pasteles Personalizados Limitados)
- Opciones predefinidas: tamaños, sabores, toppings, decoraciones
- Precios base + costos adicionales por personalización
- Sistema de configuración rápida

### 🎨 Pedidos Completamente Personalizados

**⚡ Solución Innovadora para Pedidos Sin Estándar:**

#### Sistema de Cotización Dinámica
- **Estimación por Componentes**: Basada en ingredientes + mano de obra
- **Multiplicador de Ganancia**: Aplicación automática del 200% sobre costos base
- **Flexibilidad Total**: Permite cualquier tipo de personalización

#### Flujo de Trabajo Optimizado
1. **Cotización Inicial**: Estimación automática basada en componentes
2. **Confirmación con Anticipo**: Cliente paga 30-50% para confirmar
3. **Seguimiento del Proceso**: Estados desde cotizado hasta entregado
4. **Ajuste Final**: Precio final ajustable al momento de entrega

#### Integración Contable Inteligente
- **Anticipos Registrados**: Se contabilizan como ingresos pendientes
- **Cierre Correcto**: Los pagos finales completan el registro
- **Tracking Separado**: Flujo contable independiente para mayor control

### 💰 Panel Administrativo Unificado

#### Cierre de Caja Integral
- **Consolidación Total**: Vitrina + Cake Bar + Pedidos Personalizados
- **Métodos de Pago**: Efectivo, tarjeta, transferencias por separado
- **Reconciliación**: Comparación entre efectivo esperado vs contado real
- **Reportes Diarios**: Métricas completas del día

#### Características del Dashboard
- Estado de caja en tiempo real
- Métricas por tipo de venta
- Ventas recientes y pagos de pedidos personalizados
- Alertas de diferencias en caja

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de Datos**: SQLite con Prisma ORM
- **UI Components**: Lucide React Icons
- **Validación**: Zod (preparado)
- **Autenticación**: NextAuth.js (preparado)

### Estructura de la Base de Datos

#### Modelos Principales
- **Users**: Gestión de empleados y roles
- **Categories**: Organización de productos
- **Ingredients**: Materias primas con costos
- **Products**: Productos de vitrina y cake bar
- **Sales**: Ventas tradicionales
- **CustomOrders**: Pedidos personalizados
- **CashRegister**: Control de caja diario

#### Relaciones Inteligentes
- Productos vinculados a ingredientes para costeo automático
- Ventas separadas por tipo para reporting detallado
- Pagos de pedidos personalizados trackados independientemente

## 🚀 Instalación y Configuración

### Requisitos Previos
- Node.js 18+
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd pastry-management
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar base de datos**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```

5. **Acceder a la aplicación**
   ```
   http://localhost:3000
   ```

### Variables de Entorno
Crear archivo `.env` con:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

## 📱 Uso del Sistema

### Para Empleados
1. **Ventas de Vitrina**: Seleccionar productos, procesar pago
2. **Cake Bar**: Configurar opciones, calcular precio, procesar venta
3. **Inventario**: Revisar stock, alertas de productos agotándose

### Para Administradores
1. **Gestión de Productos**: CRUD completo de categorías y productos
2. **Control de Ingredientes**: Actualización de costos y stock
3. **Pedidos Personalizados**: Cotización, seguimiento, facturación
4. **Cierre de Caja**: Consolidación diaria de todas las ventas

## 🔄 Flujo de Pedidos Personalizados

### Problema Resuelto
**Antes**: Los pedidos personalizados no tenían estándar, dificultando la contabilidad y causando errores en caja.

**Ahora**: Sistema inteligente que:
- Estima costos automáticamente basado en componentes
- Registra anticipos por separado
- Permite ajustes finales sin afectar el balance
- Mantiene trazabilidad completa del proceso

### Proceso Paso a Paso

1. **Cliente solicita pedido personalizado**
   - Se registran ingredientes base necesarios
   - Se estima tiempo de trabajo (mano de obra)
   - Sistema calcula costo automáticamente

2. **Cotización**
   - Costo base (ingredientes + trabajo) × 2.0 (multiplicador ganancia)
   - Se presenta precio al cliente

3. **Confirmación**
   - Cliente acepta y paga anticipo (30-50%)
   - Pedido pasa a estado "CONFIRMADO"
   - Anticipo se registra en caja del día

4. **Producción**
   - Seguimiento de estado: EN_PROCESO → LISTO
   - Posibilidad de ajustar costo final según trabajo real

5. **Entrega**
   - Cliente paga diferencia si hay ajuste final
   - Pago se registra en caja del día de entrega
   - Pedido pasa a "ENTREGADO"

## 🎯 Beneficios del Sistema

### Para el Negocio
- **Control Total**: Visibilidad completa de todas las operaciones
- **Contabilidad Precisa**: Caja siempre cuadrada, sin importar tipo de venta
- **Eficiencia**: Procesos automatizados reducen errores manuales
- **Escalabilidad**: Sistema preparado para crecimiento del negocio

### Para los Empleados
- **Facilidad de Uso**: Interfaces intuitivas para cada tipo de venta
- **Automatización**: Cálculos automáticos de precios y costos
- **Flexibilidad**: Adaptable a cualquier tipo de pedido personalizado

### Para los Clientes
- **Transparencia**: Cotizaciones claras y detalladas
- **Flexibilidad**: Posibilidad de personalizar cualquier aspecto
- **Confianza**: Sistema robusto que garantiza cumplimiento

## 🔮 Próximas Mejoras

- [ ] **Autenticación completa** con roles y permisos
- [ ] **Reportes avanzados** con gráficos y análisis
- [ ] **Gestión de proveedores** y compras
- [ ] **Sistema de reservas** para cake bar
- [ ] **Notificaciones** para fechas de entrega
- [ ] **App móvil** para empleados
- [ ] **Integración** con sistemas de facturación
- [ ] **Backup automático** de datos

## 📞 Soporte

Para soporte técnico o consultas sobre implementación, contactar al equipo de desarrollo.

---

**Desarrollado con ❤️ para optimizar la gestión de pastelerías**