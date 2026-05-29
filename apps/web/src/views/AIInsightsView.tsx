import { useState, useMemo } from 'react';
import {
  Brain, ShieldAlert, ShieldCheck, Wrench, TrendingUp,
  ChevronRight, AlertCircle, Clock, Sparkles,
} from 'lucide-react';
import type { AIInsight, AIInsightType, AIRiskLevel } from '@fleetpulse/types';
import { useFleet } from '../store/fleetStore';
import { GlowCard } from '../components/ui/GlowCard';
import { cn } from '../lib/utils';
import { formatRelativeTime } from '../lib/utils';

// ─── Styles ───────────────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<AIRiskLevel, {
  border: string; bg: string; text: string; icon: string;
}> = {
  critical: { border: 'border-red-800/50',    bg: 'bg-red-950/30',    text: 'text-red-400',    icon: 'text-red-400' },
  high:     { border: 'border-orange-800/40', bg: 'bg-orange-950/20', text: 'text-orange-400', icon: 'text-orange-400' },
  medium:   { border: 'border-amber-800/40',  bg: 'bg-amber-950/20',  text: 'text-amber-400',  icon: 'text-amber-400' },
  low:      { border: 'border-zinc-800',      bg: 'bg-zinc-900/50',   text: 'text-zinc-400',   icon: 'text-zinc-500' },
};

const TYPE_ICONS: Record<AIInsightType, React.ComponentType<{ className?: string }>> = {
  prediction:     TrendingUp,
  anomaly:        AlertCircle,
  recommendation: Sparkles,
  maintenance:    Wrench,
};

const TYPE_LABELS: Record<AIInsightType, string> = {
  prediction:     'Prediction',
  anomaly:        'Anomaly',
  recommendation: 'Recommendation',
  maintenance:    'Maintenance',
};

// ─── Confidence bar ───────────────────────────────────────────────────────────

function ConfidenceBar({ value, severity }: { value: number; severity: AIRiskLevel }) {
  const colorClass = severity === 'critical' ? 'bg-red-500'
    : severity === 'high' ? 'bg-orange-500'
    : severity === 'medium' ? 'bg-amber-500'
    : 'bg-zinc-500';
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-700', colorClass)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs tabular-nums text-zinc-500">{value}%</span>
    </div>
  );
}

// ─── Insight card ─────────────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: AIInsight }) {
  const [expanded, setExpanded] = useState(false);
  const styles = SEVERITY_STYLES[insight.severity];
  const Icon = TYPE_ICONS[insight.type];

  return (
    <GlowCard
      glowColor={
        insight.severity === 'critical' ? 'red'
        : insight.severity === 'high' ? 'amber'
        : 'none'
      }
      className={cn('p-4 space-y-3', styles.bg, styles.border)}
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
          insight.severity === 'critical' ? 'bg-red-500/15'
          : insight.severity === 'high' ? 'bg-orange-500/15'
          : 'bg-zinc-800',
        )}>
          <Icon className={cn('h-4 w-4', styles.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-xs font-bold uppercase tracking-wide', styles.text)}>
              {TYPE_LABELS[insight.type]}
            </span>
            <span className="text-xs text-zinc-600">·</span>
            <span className="text-xs text-zinc-500">{insight.deviceName}</span>
            {insight.estimatedTimeToFailure && (
              <span className={cn('ml-auto flex items-center gap-1 text-xs font-medium', styles.text)}>
                <Clock className="h-3 w-3" />
                TTF: {insight.estimatedTimeToFailure}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm font-semibold text-zinc-100">{insight.title}</p>
        </div>
        <ChevronRight className={cn('h-4 w-4 flex-shrink-0 text-zinc-600 transition-transform', expanded && 'rotate-90')} />
      </div>

      {/* Confidence */}
      <div>
        <div className="mb-1 flex justify-between text-[10px] text-zinc-600">
          <span>AI Confidence</span>
          <span className={styles.text}>{insight.affectedMetric}</span>
        </div>
        <ConfidenceBar value={insight.confidence} severity={insight.severity} />
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="space-y-2 border-t border-zinc-800/50 pt-3 animate-fade-in">
          <p className="text-xs text-zinc-400 leading-relaxed">{insight.description}</p>
          <p className="text-[10px] text-zinc-600">{formatRelativeTime(insight.timestamp)}</p>
        </div>
      )}
    </GlowCard>
  );
}

// ─── Fleet summary ────────────────────────────────────────────────────────────

function FleetSummary() {
  const { state } = useFleet();
  const { devices, aiInsights } = state;

  const criticalCount = aiInsights.filter((i) => i.severity === 'critical').length;
  const highCount = aiInsights.filter((i) => i.severity === 'high').length;
  const healthyCount = devices.filter((d) => d.aiRiskLevel === 'low').length;

  const summary = criticalCount > 0
    ? `⚠ ${criticalCount} device${criticalCount > 1 ? 's' : ''} require immediate attention. Thermal and battery anomalies detected across the fleet. Recommend maintenance dispatch within 2 hours.`
    : highCount > 0
    ? `${highCount} device${highCount > 1 ? 's' : ''} show elevated risk. Monitor closely and schedule preventive maintenance. No immediate failures predicted.`
    : `Fleet operating nominally. ${healthyCount} devices healthy. Predictive models show no failures within 48-hour horizon. Routine maintenance cycle on schedule.`;

  return (
    <GlowCard glowColor={criticalCount > 0 ? 'red' : highCount > 0 ? 'amber' : 'blue'} className="p-5">
      <div className="flex items-start gap-3">
        <div className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
          criticalCount > 0 ? 'bg-red-500/15' : 'bg-blue-500/15',
        )}>
          <Brain className={cn('h-5 w-5', criticalCount > 0 ? 'text-red-400' : 'text-blue-400')} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-zinc-200">AI Fleet Summary</p>
            <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] text-blue-400 font-medium">
              GPT-4o powered
            </span>
          </div>
          <p className="mt-1.5 text-sm text-zinc-400 leading-relaxed">{summary}</p>
        </div>
      </div>
    </GlowCard>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

type SortOption = 'severity' | 'confidence' | 'time';
type TypeFilter = AIInsightType | 'all';

export function AIInsightsView({ onSelectDevice }: { onSelectDevice: (deviceId: string) => void }) {
  const { state } = useFleet();
  const [sort, setSort] = useState<SortOption>('severity');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const SEVERITY_ORDER: Record<AIRiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };

  const sorted = useMemo(() => {
    let list = [...state.aiInsights];
    if (typeFilter !== 'all') list = list.filter((i) => i.type === typeFilter);
    if (sort === 'severity')   list.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
    if (sort === 'confidence') list.sort((a, b) => b.confidence - a.confidence);
    if (sort === 'time')       list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return list;
  }, [state.aiInsights, sort, typeFilter]);

  const criticalCount = state.aiInsights.filter((i) => i.severity === 'critical').length;
  const highCount     = state.aiInsights.filter((i) => i.severity === 'high').length;
  const totalCount    = state.aiInsights.length;

  return (
    <div className="space-y-5 p-6">
      {/* Fleet summary */}
      <FleetSummary />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Insights', value: totalCount, icon: Brain,       color: 'text-blue-400' },
          { label: 'Critical',       value: criticalCount, icon: ShieldAlert, color: 'text-red-400' },
          { label: 'High Risk',      value: highCount,  icon: AlertCircle,  color: 'text-orange-400' },
          { label: 'Healthy',        value: state.devices.filter((d) => d.aiRiskLevel === 'low').length, icon: ShieldCheck, color: 'text-emerald-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <GlowCard key={label} className="flex items-center gap-3 px-4 py-3">
            <Icon className={cn('h-5 w-5', color)} />
            <div>
              <p className="text-xs text-zinc-500">{label}</p>
              <p className={cn('text-xl font-bold tabular-nums', color)}>{value}</p>
            </div>
          </GlowCard>
        ))}
      </div>

      {/* Filters + sort */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {(['all', 'prediction', 'anomaly', 'recommendation', 'maintenance'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-xs font-medium capitalize transition-colors',
                typeFilter === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200',
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-zinc-500">
          <span>Sort:</span>
          {(['severity', 'confidence', 'time'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={cn(
                'rounded px-2 py-1 capitalize transition-colors',
                sort === s ? 'text-zinc-200 bg-zinc-800' : 'hover:text-zinc-300',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Insight list */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 py-20 text-zinc-600">
          <ShieldCheck className="h-10 w-10" />
          <p className="text-sm">No AI insights yet — fleet is being analyzed</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {sorted.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
