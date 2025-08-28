import { Session } from 'next-auth';
import { Role } from '@prisma/client';

/**
 * Check if user has a specific role
 */
export function hasRole(session: Session | null, role: Role): boolean {
  if (!session?.user?.role) return false;
  return session.user.role === role;
}

/**
 * Check if user has admin role
 */
export function isAdmin(session: Session | null): boolean {
  return hasRole(session, Role.ADMIN);
}

/**
 * Check if user has supervisor role
 */
export function isSupervisor(session: Session | null): boolean {
  return hasRole(session, Role.SUPERVISOR);
}

/**
 * Check if user has worker role
 */
export function isWorker(session: Session | null): boolean {
  return hasRole(session, Role.WORKER);
}

/**
 * Check if user has admin or supervisor role (management roles)
 */
export function isManagement(session: Session | null): boolean {
  return isAdmin(session) || isSupervisor(session);
}

/**
 * Check if user has minimum required role level
 * Role hierarchy: ADMIN > SUPERVISOR > WORKER
 */
export function hasMinimumRole(session: Session | null, minimumRole: Role): boolean {
  if (!session?.user?.role) return false;
  
  const roleHierarchy: Record<Role, number> = {
    [Role.WORKER]: 1,
    [Role.SUPERVISOR]: 2,
    [Role.ADMIN]: 3
  };
  
  const userRoleLevel = roleHierarchy[session.user.role];
  const minimumRoleLevel = roleHierarchy[minimumRole];
  
  return userRoleLevel >= minimumRoleLevel;
}

/**
 * Get user role or return default
 */
export function getUserRole(session: Session | null, defaultRole: Role = Role.WORKER): Role {
  return session?.user?.role || defaultRole;
}