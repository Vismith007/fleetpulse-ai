import { useState, useMemo } from 'react';
import {
  AlertTriangle, CheckCircle2, Clock, Filter,
  ChevronDown, ChevronRight, Cpu, User, Bell, BellOff,
  Flame, Info, ShieldAlert,
} from 'lucide-react';
import { useFleet } from '../store/fleetStore';
import { GlowCard } from '../components/ui/GlowCard';
import { cn } from '../lib/utils';
import { formatRelativeTime } from '../lib/utils';
import type { Alert, AlertSeverity } from '@fleetpulse/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type SeverityFilter = 'all' | AlertSeverity;
type StatusFilter = 'all' | 'active' | 'acknowledged';

interface EnrichedAlert extends Alert {
  acknowledged: boolean;
  assignedTo: string | null;
  escalated: boolean;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<AlertSeverity, string> = {
  critical: 'border-red-800/50 bg-red-950/20 text-red-400',
  warning:  'border-amber-800/50 bg-amber-950/20 text-amber-400',
  info:     'border-blue-800/50 bg-blue-950/20 text-blue-400',
};

const SEVERITY_BADGE: Record<AlertSeverity, string> = {
  critical: 'bg-red-500/20 text-red-400 border border-red-800/40',
  warning:  'bg-amber-500/20 text-amber-400 border border-amber-800/40',
  info:     'bg-blue-500/20 text-blue-400 border border-blue-800/40',
};

const SEVERITY_ICON: Record<AlertSeverity, React.ReactNode> = {
  critical: <Flame className="h-3.5 w-3.5" />,
  warning:  <AlertTriangle className="h-3.5 w-3.5" />,
  info:     <Info className="h-3.5 w-3.5" />,
};

const ASSIGNEES = ['Alex K.', 'Sam T.', 'Jordan M.', 'Riley P.', 'Casey O.'];

// ─── Main view ────────────────────────────────────────────────────────────────

export function AlertCenterView() {
  const { state } = useFleet();
  const { alerts } = state;

  // Client-side enrichment (acknowledged state lives in component)
  const [enriched, setEnriched] = useState<Record<string, { acknowledged: boolean; assignedTo: string | null; escalated: boolean }>>({});
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const enrichedAlerts: EnrichedAlert[] = useMemo(() =>
    alerts.map((a) => ({
      ...a,
      acknowledged: enriched[a.id]?.acknowledged ?? false,
      assignedTo: enriched[a.id]?.assignedTo ?? null,
      escalated: enriched[a.id]?.escalated ?? false,
    })),
    [alerts, enriched],
  );

  const filtered = useMemo(() => {
    let list = enrichedAlerts;
    if (severityFilter !== 'all') list = list.filter((a) => a.severity === severityFilter);
    if (statusFilter === 'active') list = list.filter((a) => !a.acknowledged);
    if (statusFilter === 'acknowledged') list = list.filter((a) => a.acknowledged);
    return list;
  }, [enrichedAlerts, severityFilter, statusFilter]);

  const criticalCount     = enrichedAlerts.filter((a) => a.severity === 'critical' && !a.acknowledged).length;
  const warningCount      = enrichedAlerts.filter((a) => a.severity === 'warning' && !a.acknowledged).length;
  const acknowledgedCount = enrichedAlerts.filter((a) => a.acknowledged).length;
  const escalatedCount    = enrichedAlerts.filter((a) => a.escalated).length;

  const acknowledge = (id: string) => {
    setEnriched((prev) => ({ ...prev, [id]: { ...prev[id], acknowledged: true, assignedTo: prev[id]?.assignedTo ?? null, escalated: prev[id]?.escalated ?? false } }));
  };

  const assign = (id: string, assignee: string) => {
    setEnriched((prev) => ({ ...prev, [id]: { ...prev[id], assignedTo: assignee, acknowledged: prev[id]?.acknowledged ?? false, escalated: prev[id]?.escalated ?? false } }));
  };

  const escalate = (id: string) => {
    setEnriched((prev) => ({ ...prev, [id]: { ...prev[id], escalated: true, acknowledged: prev[id]?.acknowledged ?? false, assignedTo: prev[id]?.assignedTo ?? null } }));
  };

  return (
    <div className="space-y-5 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Alert Center</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{alerts.length} total · {criticalCount + warningCount} active</p>
        </div>
        {criticalCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full border border-red-800/40 bg-red-950/30 px-3 py-1.5 text-xs font-medium text-red-400 animate-pulse">
            <Flame className="h-3 w-3" />
            {criticalCount} Critical
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Critical" value={criticalCount} accent="text-red-400" bg="border-red-800/30 bg-red-950/20" icon={<Flame className="h-4 w-4 text-red-400" />} />
        <SummaryCard label="Warning" value={warningCount} accent="text-amber-400" bg="border-amber-800/30 bg-amber-950/20" icon={<AlertTriangle className="h-4 w-4 text-amber-400" />} />
        <SummaryCard label="Acknowledged" value={acknowledgedCount} accent="text-emerald-400" bg="border-emerald-800/30 bg-emerald-950/20" icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />} />
        <SummaryCard label="Escalated" value={escalatedCount} accent="text-purple-400" bg="border-purple-800/30 bg-purple-950/20" icon={<ShieldAlert className="h-4 w-4 text-purple-400" />} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <Filter className="h-3.5 w-3.5" />
        </div>
        {(['all', 'critical', 'warning', 'info'] as SeverityFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors capitalize',
              severityFilter === s
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200',
            )}
          >
            {s}
          </button>
        ))}
        <div className="flex gap-1 ml-auto">
          {(['all', 'active', 'acknowledged'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors capitalize',
                statusFilter === s
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'bg-zinc-800/60 text-zinc-500 hover:bg-zinc-700',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Alert list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 py-20 text-zinc-600">
            <BellOff className="h-10 w-10" />
            <p className="text-sm">No alerts match current filters</p>
          </div>
        ) : (
          filtered.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              expanded={expandedId === alert.id}
              onToggle={() => setExpandedId((prev) => prev === alert.id ? null : alert.id)}
              onAcknowledge={() => acknowledge(alert.id)}
              onAssign={(assignee) => assign(alert.id, assignee)}
              onEscalate={() => escalate(alert.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Alert Row ────────────────────────────────────────────────────────────────

interface AlertRowProps {
  alert: EnrichedAlert;
  expanded: boolean;
  onToggle: () => void;
  onAcknowledge: () => void;
  onAssign: (assignee: string) => void;
  onEscalate: () => void;
}

function AlertRow({ alert, expanded, onToggle, onAcknowledge, onAssign, onEscalate }: AlertRowProps) {
  const [showAssign, setShowAssign] = useState(false);

  return (
    <div className={cn('rounded-xl border transition-all', SEVERITY_STYLES[alert.severity], alert.acknowledged && 'opacity-60')}>
      <button className="w-full text-left px-4 py-3 flex items-start gap-3" onClick={onToggle}>
        <div className="mt-0.5 flex-shrink-0">{SEVERITY_ICON[alert.severity]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', SEVERITY_BADGE[alert.severity])}>
              {alert.severity}
            </span>
            <span className="text-xs font-semibold text-zinc-200 truncate">{alert.deviceName}</span>
            {alert.acknowledged && (
              <span className="rounded-full bg-emerald-500/20 border border-emerald-800/40 px-2 py-0.5 text-[10px] text-emerald-400">ACK</span>
            )}
            {alert.escalated && (
              <span className="rounded-full bg-purple-500/20 border border-purple-800/40 px-2 py-0.5 text-[10px] text-purple-400">ESCALATED</span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{alert.message}</p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <span className="text-[10px] text-zinc-600">{formatRelativeTime(alert.timestamp)}</span>
          {expanded ? <ChevronDown className="h-3.5 w-3.5 text-zinc-600" /> : <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-current/20 px-4 py-3 space-y-3">
          <p className="text-xs text-zinc-400 leading-relaxed">{alert.message}</p>

          <div className="flex flex-wrap gap-1.5 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(alert.timestamp).toLocaleString()}</span>
            <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> Device: {alert.deviceId}</span>
            {alert.assignedTo && (
              <span className="flex items-center gap-1"><User className="h-3 w-3" /> Assigned: {alert.assignedTo}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {!alert.acknowledged && (
              <button
                onClick={onAcknowledge}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600/20 border border-emerald-700/40 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-600/30 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Acknowledge
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setShowAssign((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600/20 border border-blue-700/40 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-600/30 transition-colors"
              >
                <User className="h-3.5 w-3.5" />
                {alert.assignedTo ? 'Reassign' : 'Assign'}
                <ChevronDown className="h-3 w-3" />
              </button>
              {showAssign && (
                <div className="absolute bottom-full mb-1 left-0 z-10 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl py-1 min-w-[140px]">
                  {ASSIGNEES.map((name) => (
                    <button
                      key={name}
                      onClick={() => { onAssign(name); setShowAssign(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!alert.escalated && alert.severity === 'critical' && (
              <button
                onClick={onEscalate}
                className="flex items-center gap-1.5 rounded-lg bg-purple-600/20 border border-purple-700/40 px-3 py-1.5 text-xs font-medium text-purple-400 hover:bg-purple-600/30 transition-colors"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Escalate
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, accent, bg, icon }: { label: string; value: number; accent: string; bg: string; icon: React.ReactNode }) {
  return (
    <div className={cn('rounded-xl border p-3 flex items-center gap-3', bg)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900/60">
        {icon}
      </div>
      <div>
        <p className={cn('text-xl font-bold', accent)}>{value}</p>
        <p className="text-[11px] text-zinc-500">{label}</p>
      </div>
    </div>
  );
}
