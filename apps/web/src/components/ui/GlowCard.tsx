import { cn } from '../../lib/utils';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'none';
  intensity?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const GLOW_STYLES = {
  blue:    'shadow-blue-500/20 hover:shadow-blue-500/30 border-blue-900/40 hover:border-blue-700/50',
  emerald: 'shadow-emerald-500/20 hover:shadow-emerald-500/30 border-emerald-900/40 hover:border-emerald-700/50',
  amber:   'shadow-amber-500/20 hover:shadow-amber-500/30 border-amber-900/40 hover:border-amber-700/50',
  red:     'shadow-red-500/25 hover:shadow-red-500/35 border-red-900/40 hover:border-red-700/50',
  purple:  'shadow-purple-500/20 hover:shadow-purple-500/30 border-purple-900/40 hover:border-purple-700/50',
  none:    'border-zinc-800/60 hover:border-zinc-700/60',
};

const INTENSITY_STYLES = {
  sm: 'shadow-md hover:shadow-lg',
  md: 'shadow-lg hover:shadow-xl',
  lg: 'shadow-xl hover:shadow-2xl',
};

export function GlowCard({
  children,
  className,
  glowColor = 'none',
  intensity = 'md',
  onClick,
}: GlowCardProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-zinc-900/80 backdrop-blur-sm transition-all duration-300',
        GLOW_STYLES[glowColor],
        INTENSITY_STYLES[intensity],
        onClick && 'cursor-pointer text-left w-full hover:-translate-y-0.5 active:translate-y-0',
        className,
      )}
    >
      {/* Subtle top-edge highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-600/30 to-transparent" />
      {children}
    </Tag>
  );
}
