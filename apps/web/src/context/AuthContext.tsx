import { createContext, useContext, useState, type ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'operator' | 'technician' | 'viewer';

export interface OrgInfo {
  id: string;
  name: string;
  plan: 'starter' | 'professional' | 'enterprise';
  deviceLimit: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarInitials: string;
  org: OrgInfo;
}

interface AuthContextValue {
  user: AuthUser | null;
  orgs: OrgInfo[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  switchOrg: (orgId: string) => void;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ORGS: OrgInfo[] = [
  { id: 'org-1', name: 'Acme Industries', plan: 'enterprise', deviceLimit: 500 },
  { id: 'org-2', name: 'BuildCorp IoT', plan: 'professional', deviceLimit: 100 },
  { id: 'org-3', name: 'Dev Sandbox', plan: 'starter', deviceLimit: 20 },
];

const MOCK_USERS: Record<string, AuthUser & { password: string }> = {
  'admin@fleetpulse.io': {
    id: 'u-1', name: 'Alex Admin', email: 'admin@fleetpulse.io', password: 'admin',
    role: 'admin', avatarInitials: 'AA', org: MOCK_ORGS[0],
  },
  'operator@fleetpulse.io': {
    id: 'u-2', name: 'Sam Operator', email: 'operator@fleetpulse.io', password: 'operator',
    role: 'operator', avatarInitials: 'SO', org: MOCK_ORGS[0],
  },
  'tech@fleetpulse.io': {
    id: 'u-3', name: 'Jordan Tech', email: 'tech@fleetpulse.io', password: 'tech',
    role: 'technician', avatarInitials: 'JT', org: MOCK_ORGS[1],
  },
  'viewer@fleetpulse.io': {
    id: 'u-4', name: 'Riley Viewer', email: 'viewer@fleetpulse.io', password: 'viewer',
    role: 'viewer', avatarInitials: 'RV', org: MOCK_ORGS[2],
  },
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [currentOrgId, setCurrentOrgId] = useState<string>('org-1');

  const login = (email: string, password: string): boolean => {
    const mockUser = MOCK_USERS[email.toLowerCase()];
    if (!mockUser || mockUser.password !== password) return false;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...safeUser } = mockUser;
    setUser(safeUser);
    setCurrentOrgId(safeUser.org.id);
    return true;
  };

  const logout = () => setUser(null);

  const switchOrg = (orgId: string) => {
    if (!user) return;
    const org = MOCK_ORGS.find((o) => o.id === orgId);
    if (!org) return;
    setUser({ ...user, org });
    setCurrentOrgId(orgId);
  };

  return (
    <AuthContext.Provider value={{ user, orgs: MOCK_ORGS, login, logout, switchOrg }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export function canWrite(role: UserRole): boolean {
  return role === 'admin' || role === 'operator';
}

export function canAdmin(role: UserRole): boolean {
  return role === 'admin';
}
