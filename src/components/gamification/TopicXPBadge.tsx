import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopicXPBadgeProps {
  xp: number;
  level: number;
  className?: string;
  compact?: boolean;
}

export function TopicXPBadge({ xp, level, className, compact = false }: TopicXPBadgeProps) {
  if (compact) {
    return (
      <div className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium",
        className
      )}>
        <Sparkles className="w-3 h-3" />
        <span>{xp} XP</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20",
      className
    )}>
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/20">
        <Sparkles className="w-3.5 h-3.5 text-accent" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-accent">{xp.toLocaleString()} XP</span>
        <span className="text-xs text-muted-foreground">Level {level}</span>
      </div>
    </div>
  );
}
