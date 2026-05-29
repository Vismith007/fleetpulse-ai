import { Wifi, WifiOff, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import type { WSStatus } from '../../hooks/useWebSocket';
import { cn } from '../../lib/utils';
import { useFleet } from '../../store/fleetStore';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

function WSBadge({ status, reconnectCount }: { status: WSStatus; reconnectCount: number }) {
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';
  return (
    <div className={cn(
      'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
      isConnected
        ? 'border-emerald-800/60 bg-emerald-950/60 text-emerald-400'
        : isConnecting
        ? 'border-zinc-700 bg-zinc-900 text-zinc-400'
        : 'border-red-900/60 bg-red-950/60 text-red-400',
    )}>
      {isConnected
        ? <Wifi className="h-3 w-3" />
        : isConnecting
        ? <Loader2 className="h-3 w-3 animate-spin" />
        : <WifiOff className="h-3 w-3" />}
      <span>{isConnected ? 'Live' : isConnecting ? 'Connecting…' : `Retry ${reconnectCount}`}</span>
      {isConnected && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
    </div>
  );
}

function SystemHealthBadge({ score }: { score: number }) {
  const animated = useAnimatedCounter(score, 800);
  const isHealthy = score >= 80;
  return (
    <div className={cn(
      'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
      isHealthy
        ? 'border-blue-800/60 bg-blue-950/60 text-blue-400'
        : 'border-amber-800/60 bg-amber-950/60 text-amber-400',
    )}>
      {isHealthy ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
      <span>Fleet Health {animated}%</span>
    </div>
  );
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const { state } = useFleet();
  const score = state.systemHealth?.overallScore ?? 0;

  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-zinc-800/60 bg-zinc-950/80 px-6 backdrop-blur-sm">
      <div>
        <h1 className="text-sm font-semibold text-zinc-100">{title}</h1>
        {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {state.isInitialized && <SystemHealthBadge score={score} />}
        <WSBadge status={state.wsStatus} reconnectCount={state.wsReconnectCount} />
      </div>
    </header>
  );
}
