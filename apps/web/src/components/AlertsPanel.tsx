import { AlertTriangle, AlertCircle, Info, Bell, X } from 'lucide-react';
import type { Alert, AlertSeverity } from '@fleetpulse/types';
import { cn } from '../lib/utils';
import { formatRelativeTime } from '../lib/utils';

interface AlertsPanelProps {
  alerts: Alert[];
  isOpen: boolean;
  onClose: () => void;
}

const SEVERITY_STYLES: Record<AlertSeverity, string> = {
  critical: 'border-l-red-500 bg-red-500/5',
  warning: 'border-l-amber-500 bg-amber-500/5',
  info: 'border-l-blue-500 bg-blue-500/5',
};

const SEVERITY_ICON_COLOR: Record<AlertSeverity, string> = {
  critical: 'text-red-400',
  warning: 'text-amber-400',
  info: 'text-blue-400',
};

const SEVERITY_ICONS: Record<AlertSeverity, React.ComponentType<{ className?: string }>> = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

function AlertItem({ alert }: { alert: Alert }) {
  const Icon = SEVERITY_ICONS[alert.severity];
  return (
    <div
      className={cn(
        'flex gap-3 border-l-2 px-3 py-2.5 text-sm animate-fade-in',
        SEVERITY_STYLES[alert.severity],
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 flex-shrink-0', SEVERITY_ICON_COLOR[alert.severity])} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-zinc-200 truncate">{alert.deviceName}</p>
        <p className="text-zinc-400 text-xs mt-0.5 leading-snug">{alert.message}</p>
        <p className="text-zinc-600 text-xs mt-1">{formatRelativeTime(alert.timestamp)}</p>
      </div>
    </div>
  );
}

export function AlertsPanel({ alerts, isOpen, onClose }: AlertsPanelProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <aside
        className={cn(
          'fixed right-0 top-0 z-40 flex h-full w-80 flex-col border-l border-zinc-800 bg-zinc-950 transition-transform duration-300 lg:static lg:translate-x-0 lg:h-auto lg:min-h-0',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-200">Alerts</h2>
            {alerts.length > 0 && (
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-xs font-medium text-amber-400">
                {alerts.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Alert list */}
        <div className="flex-1 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-zinc-600">
              <Bell className="h-8 w-8" />
              <p className="text-sm">No alerts yet</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {alerts.map((alert) => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
