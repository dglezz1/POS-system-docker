import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export async function verifyJWT(token: string): Promise<AuthUser | null> {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Verificar que el usuario existe en la base de datos
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    return await verifyJWT(token);
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export function requireAdmin(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN';
}

export function requireAdminOrManager(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN' || user?.role === 'MANAGER';
}