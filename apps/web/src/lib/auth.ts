export interface User {
  sub: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'AGENT' | 'USER';
  tenantId: string;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0], // Fallback to email prefix if name not available
      role: payload.role,
      tenantId: payload.tenantId,
    };
  } catch {
    return null;
  }
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'ADMIN';
}

export function isAgent(user: User | null): boolean {
  return user?.role === 'AGENT' || user?.role === 'ADMIN';
}

export function canManageUsers(user: User | null): boolean {
  return isAgent(user);
}

