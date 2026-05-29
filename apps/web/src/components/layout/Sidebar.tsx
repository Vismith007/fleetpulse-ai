import { useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Map,
  Terminal,
  Brain,
  Activity,
  ChevronLeft,
  ChevronRight,
  Settings,
  Bell,
  Command,
  TrendingUp,
  LogOut,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useFleet } from '../../store/fleetStore';
import { useAuth, type UserRole } from '../../context/AuthContext';

export type ViewId = 'command' | 'dashboard' | 'analytics' | 'business' | 'map' | 'terminal' | 'ai' | 'alerts';

const ROLE_BADGE: Record<UserRole, string> = {
  admin:      'bg-red-500/20 text-red-400 border-red-800/40',
  operator:   'bg-blue-500/20 text-blue-400 border-blue-800/40',
  technician: 'bg-amber-500/20 text-amber-400 border-amber-800/40',
  viewer:     'bg-zinc-500/20 text-zinc-400 border-zinc-800/40',
};

interface NavItem {
  id: ViewId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: (alerts: number, insights: number) => number | null;
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'command',   label: 'Command Center', icon: Command,        section: 'Operations' },
  { id: 'dashboard', label: 'Fleet Dashboard',icon: LayoutDashboard },
  { id: 'alerts',    label: 'Alert Center',   icon: Bell,
    badge: (alerts) => alerts > 0 ? alerts : null },
  { id: 'analytics', label: 'Analytics',      icon: BarChart3,      section: 'Intelligence' },
  { id: 'business',  label: 'Business KPIs',  icon: TrendingUp },
  { id: 'ai',        label: 'AI Insights',    icon: Brain,
    badge: (_a, insights) => (insights > 0 ? insights : null) },
  { id: 'map',       label: 'Fleet Map',      icon: Map,            section: 'Monitoring' },
  { id: 'terminal',  label: 'Terminal',       icon: Terminal },
];

interface SidebarProps {
  activeView: ViewId;
  onViewChange: (view: ViewId) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const { state } = useFleet();
  const { user, orgs, logout, switchOrg } = useAuth();

  const criticalAlerts  = state.alerts.filter((a) => a.severity === 'critical').length;
  const criticalInsights = state.aiInsights.filter((i) => i.severity === 'critical').length;

  let lastSection: string | undefined;

  return (
    <aside className={cn(
      'relative flex h-full flex-col border-r border-zinc-800/60 bg-zinc-950 transition-all duration-300',
      collapsed ? 'w-14' : 'w-56',
    )}>
      {/* Logo */}
      <div className={cn(
        'flex h-14 items-center border-b border-zinc-800/60 px-3 gap-2.5',
        collapsed && 'justify-center px-0',
      )}>
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-600/30">
          <Activity className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold tracking-tight text-zinc-100">FleetPulse</p>
            <p className="text-[10px] text-zinc-500 leading-none">Enterprise IoT</p>
          </div>
        )}
      </div>

      {/* Org switcher */}
      {!collapsed && user && (
        <div className="relative px-2 pt-2">
          <button
            onClick={() => setOrgMenuOpen((v) => !v)}
            className="flex w-full items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800/40 px-2.5 py-2 text-xs hover:bg-zinc-700/40 transition-colors"
          >
            <Building2 className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
            <span className="flex-1 text-left truncate text-zinc-300 font-medium">{user.org.name}</span>
            <ChevronDown className={cn('h-3 w-3 text-zinc-600 transition-transform', orgMenuOpen && 'rotate-180')} />
          </button>
          {orgMenuOpen && (
            <div className="absolute left-2 right-2 top-full z-20 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl py-1">
              {orgs.map((org) => (
                <button
                  key={org.id}
                  onClick={() => { switchOrg(org.id); setOrgMenuOpen(false); }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-800 transition-colors',
                    user.org.id === org.id ? 'text-blue-400' : 'text-zinc-400',
                  )}
                >
                  <Building2 className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{org.name}</span>
                  <span className={cn(
                    'ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase border',
                    org.plan === 'enterprise' ? 'bg-purple-500/20 text-purple-400 border-purple-800/40' :
                    org.plan === 'professional' ? 'bg-blue-500/20 text-blue-400 border-blue-800/40' :
                    'bg-zinc-500/20 text-zinc-400 border-zinc-800/40',
                  )}>
                    {org.plan}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-2 pt-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const badgeCount = item.badge ? item.badge(criticalAlerts, criticalInsights) : null;
          const isActive = activeView === item.id;
          const showSection = !collapsed && item.section && item.section !== lastSection;
          lastSection = item.section ?? lastSection;

          return (
            <div key={item.id}>
              {showSection && (
                <p className="px-2.5 pb-1 pt-3 text-[9px] font-semibold uppercase tracking-widest text-zinc-700">
                  {item.section}
                </p>
              )}
              <button
                onClick={() => onViewChange(item.id)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-all duration-150',
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]'
                    : 'text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-200',
                  collapsed && 'justify-center px-0',
                )}
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'drop-shadow-[0_0_6px_rgba(96,165,250,0.8)]')} />
                {!collapsed && <span className="font-medium">{item.label}</span>}
                {badgeCount !== null && badgeCount > 0 && (
                  <span className={cn(
                    'absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white',
                    collapsed ? 'right-1 top-1' : 'right-2',
                  )}>
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
                {isActive && !collapsed && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-blue-400" />
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* User profile + bottom actions */}
      <div className={cn('border-t border-zinc-800/60 p-2 space-y-0.5', collapsed && 'flex flex-col items-center')}>
        {!collapsed && user && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 px-2.5 py-2 mb-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-600/30 text-[11px] font-bold text-blue-300">
                {user.avatarInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-200 truncate">{user.name}</p>
                <span className={cn(
                  'text-[9px] rounded-full border px-1.5 py-0.5 font-semibold uppercase',
                  ROLE_BADGE[user.role],
                )}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        )}
        <button
          title="Settings"
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-200 transition-colors',
            collapsed && 'justify-center px-0',
          )}
        >
          <Settings className="h-4 w-4" />
          {!collapsed && <span className="font-medium">Settings</span>}
        </button>
        <button
          title="Log out"
          onClick={logout}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-zinc-500 hover:bg-zinc-800/70 hover:text-red-400 transition-colors',
            collapsed && 'justify-center px-0',
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="font-medium">Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-[4.5rem] flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors shadow-md z-10"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}
