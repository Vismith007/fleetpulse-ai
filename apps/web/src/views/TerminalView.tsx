import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Pause, Play, Trash2, Download, Terminal as TerminalIcon } from 'lucide-react';
import type { LogLevel } from '@fleetpulse/types';
import { useFleet } from '../store/fleetStore';
import { cn } from '../lib/utils';

const LEVEL_STYLES: Record<LogLevel, string> = {
  debug: 'text-zinc-500',
  info:  'text-cyan-400',
  warn:  'text-amber-400',
  error: 'text-red-400',
};

const LEVEL_LABELS: Record<LogLevel, string> = {
  debug: 'DEBUG',
  info:  'INFO ',
  warn:  'WARN ',
  error: 'ERROR',
};

const LEVEL_BG: Record<LogLevel, string> = {
  debug: '',
  info:  '',
  warn:  'bg-amber-500/5',
  error: 'bg-red-500/8',
};

type LevelFilter = LogLevel | 'all';

export function TerminalView() {
  const { state } = useFleet();
  const [paused, setPaused] = useState(false);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [frozenLogs, setFrozenLogs] = useState(state.logs);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Freeze logs when paused
  useEffect(() => {
    if (!paused) setFrozenLogs(state.logs);
  }, [paused, state.logs]);

  const displayLogs = paused ? frozenLogs : state.logs;

  // Auto-scroll
  useEffect(() => {
    if (!paused && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayLogs, paused]);

  const deviceNames = useMemo(() => {
    const names = [...new Set(state.logs.map((l) => l.deviceName))].sort();
    return names;
  }, [state.logs]);

  const filtered = useMemo(() => {
    return displayLogs.filter((log) => {
      if (levelFilter !== 'all' && log.level !== levelFilter) return false;
      if (deviceFilter !== 'all' && log.deviceName !== deviceFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!log.message.toLowerCase().includes(q) && !log.deviceName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [displayLogs, levelFilter, deviceFilter, search]);

  const levelCounts = useMemo(() => {
    const counts: Record<LogLevel, number> = { debug: 0, info: 0, warn: 0, error: 0 };
    for (const l of displayLogs) counts[l.level]++;
    return counts;
  }, [displayLogs]);

  const handleExport = () => {
    const text = filtered
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.deviceName}: ${l.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleetpulse-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col p-6 gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Level filters */}
        <div className="flex gap-1">
          <button
            onClick={() => setLevelFilter('all')}
            className={cn(
              'rounded px-2.5 py-1 text-xs font-mono font-medium transition-colors',
              levelFilter === 'all' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            ALL <span className="opacity-60">{displayLogs.length}</span>
          </button>
          {(['error', 'warn', 'info', 'debug'] as LogLevel[]).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-mono font-medium transition-colors',
                levelFilter === lvl ? 'bg-zinc-800 ring-1' : 'text-zinc-600 hover:text-zinc-400',
                levelFilter === lvl && LEVEL_STYLES[lvl],
              )}
            >
              {lvl.toUpperCase()} <span className="opacity-60">{levelCounts[lvl]}</span>
            </button>
          ))}
        </div>

        {/* Device filter */}
        <select
          value={deviceFilter}
          onChange={(e) => setDeviceFilter(e.target.value)}
          className="h-7 rounded border border-zinc-800 bg-zinc-900 px-2 text-xs text-zinc-300 outline-none focus:border-blue-700"
        >
          <option value="all">All devices</option>
          {deviceNames.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>

        {/* Search */}
        <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1">
          <Search className="h-3 w-3 text-zinc-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="w-40 bg-transparent text-xs text-zinc-300 placeholder-zinc-600 outline-none"
          />
        </div>

        {/* Actions */}
        <div className="ml-auto flex gap-1.5">
          <button
            onClick={() => setPaused((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
              paused
                ? 'border-amber-700/40 bg-amber-950/40 text-amber-400'
                : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200',
            )}
          >
            {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={() => setSearch('')}
            className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <Download className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Terminal window */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 font-mono text-xs"
      >
        {/* Window chrome */}
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-zinc-800 bg-zinc-950/95 px-4 py-2 backdrop-blur-sm">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-amber-500/80" />
            <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <TerminalIcon className="h-3 w-3" />
            <span>fleetpulse — live log stream</span>
            {!paused && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            )}
          </div>
          <span className="ml-auto text-zinc-700">{filtered.length} entries</span>
        </div>

        {/* Log lines */}
        <div className="p-4 space-y-px">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-zinc-700">
              {search || levelFilter !== 'all' ? 'No matching log entries' : 'Awaiting log stream…'}
            </p>
          ) : (
            filtered.slice().reverse().map((log, i) => (
              <div
                key={log.id}
                className={cn(
                  'flex items-start gap-3 rounded px-2 py-0.5 leading-relaxed transition-colors',
                  LEVEL_BG[log.level],
                  i === 0 && !paused && 'bg-zinc-800/40',
                )}
              >
                <span className="flex-shrink-0 text-zinc-700 tabular-nums">
                  {new Date(log.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
                  })}
                </span>
                <span className={cn('flex-shrink-0 font-bold', LEVEL_STYLES[log.level])}>
                  {LEVEL_LABELS[log.level]}
                </span>
                <span className="flex-shrink-0 text-blue-400/70">{log.deviceName}</span>
                <span className="text-zinc-400">{log.message}</span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
