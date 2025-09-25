'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useSystemConfig } from '@/contexts/SystemConfigContext';
import { LogOut, User, ChefHat } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

export default function Header() {
  const { user, logout } = useAuth();
  const { config } = useSystemConfig();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y Título */}
          <div className="flex items-center">
            {config.logo ? (
              <img 
                src={config.logo} 
                alt="Logo" 
                className="h-10 w-10 object-contain mr-3 rounded"
                onError={(e) => {
                  // Fallback al ícono por defecto si la imagen falla
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`bg-orange-500 p-2 rounded-lg mr-3 ${config.logo ? 'hidden' : 'flex'}`}>
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {config.systemName || 'Sistema de Gestión'}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pastelería & Repostería
              </p>
            </div>
          </div>

          {/* Usuario, Theme Toggle y Logout */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
                <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-gray-500 dark:text-gray-400 capitalize">{user.role.toLowerCase()}</p>
              </div>
            </div>

            <ThemeToggle />
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}