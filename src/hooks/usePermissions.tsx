'use client';

import { useAuth } from '@/contexts/AuthContext';

export function usePermissions() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const isEmployee = user?.role === 'EMPLOYEE';

  // Permisos específicos
  const permissions = {
    // Inventario - Solo admin y managers pueden acceder
    canViewInventory: isAdmin || isManager,
    canEditProducts: isAdmin || isManager,
    canCreateProducts: isAdmin,
    canDeleteProducts: isAdmin,
    canManageCategories: isAdmin,
    canViewProductCosts: isAdmin || isManager,
    canAdjustStock: isAdmin || isManager,
    canAccessReports: isAdmin || isManager,

    // POS
    canUsePOS: isAdmin || isManager || isEmployee,
    canApplyDiscounts: isAdmin || isManager,
    canVoidSales: isAdmin || isManager,
    canViewSalesHistory: isAdmin || isManager || isEmployee,

    // Pedidos personalizados
    canCreateCustomOrders: isAdmin || isManager || isEmployee,
    canEditCustomOrders: isAdmin || isManager,
    canDeleteCustomOrders: isAdmin,
    canManagePricing: isAdmin || isManager,

    // Administración
    canAccessAdmin: isAdmin,
    canManageUsers: isAdmin,
    canViewFinancialReports: isAdmin,
    canCloseCashRegister: isAdmin || isManager,
    canOpenCashRegister: isAdmin || isManager,

    // Configuración
    canChangeSettings: isAdmin,
    canViewAuditLogs: isAdmin || isManager,
    canExportData: isAdmin || isManager,

    // Funciones específicas del rol
    isAdmin,
    isManager,
    isEmployee,
  };

  return permissions;
}

// Hook para verificar si el usuario tiene un permiso específico
export function useHasPermission(permission: keyof ReturnType<typeof usePermissions>) {
  const permissions = usePermissions();
  return permissions[permission];
}

// Componente para mostrar/ocultar contenido basado en permisos
interface PermissionGuardProps {
  permission: keyof ReturnType<typeof usePermissions>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const hasPermission = useHasPermission(permission);
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}