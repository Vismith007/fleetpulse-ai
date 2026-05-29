import type { AIRiskLevel } from '@fleetpulse/types';
import { cn } from '../../lib/utils';
import { Brain } from 'lucide-react';

interface AnomalyBadgeProps {
  score: number;
  riskLevel: AIRiskLevel;
  className?: string;
  compact?: boolean;
}

const RISK_STYLES: Record<AIRiskLevel, string> = {
  low:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  medium:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  high:     'bg-orange-500/10 text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse',
};

const RISK_LABELS: Record<AIRiskLevel, string> = {
  low:      'Nominal',
  medium:   'Watch',
  high:     'At Risk',
  critical: 'Critical',
};

export function AnomalyBadge({ score, riskLevel, className, compact = false }: AnomalyBadgeProps) {
  return (
    <div className={cn(
      'flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium',
      RISK_STYLES[riskLevel],
      className,
    )}>
      <Brain className="h-3 w-3 flex-shrink-0" />
      {!compact && (
        <span>{RISK_LABELS[riskLevel]}</span>
      )}
      <span className="font-mono">{score}</span>
    </div>
  );
}
