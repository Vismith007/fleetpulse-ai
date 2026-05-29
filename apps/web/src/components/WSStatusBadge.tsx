import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import type { WSStatus } from '../hooks/useWebSocket';
import { cn } from '../lib/utils';

interface WSStatusBadgeProps {
  status: WSStatus;
  reconnectCount: number;
}

export function WSStatusBadge({ status, reconnectCount }: WSStatusBadgeProps) {
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        isConnected
          ? 'border-green-800 bg-green-950 text-green-400'
          : isConnecting
          ? 'border-zinc-700 bg-zinc-900 text-zinc-400'
          : 'border-red-900 bg-red-950 text-red-400',
      )}
    >
      {isConnected ? (
        <Wifi className="h-3 w-3" />
      ) : isConnecting ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <WifiOff className="h-3 w-3" />
      )}
      <span>
        {isConnected
          ? 'Live'
          : isConnecting
          ? 'Connecting…'
          : `Reconnecting (${reconnectCount})`}
      </span>
    </div>
  );
}
