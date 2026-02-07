import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface XPProgressBarProps {
  level: number;
  xpTotal: number;
  xpProgress: number;
  xpForNextLevel: number;
  compact?: boolean;
  className?: string;
}

export function XPProgressBar({
  level,
  xpTotal,
  xpProgress,
  xpForNextLevel,
  compact = false,
  className,
}: XPProgressBarProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-accent text-accent-foreground font-bold text-sm">
          {level}
        </div>
        <div className="flex-1 min-w-0">
          <Progress value={xpProgress} className="h-2" />
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {xpTotal} XP
        </span>
      </div>
    );
  }

  return (
    <div className={cn("bg-card rounded-xl border border-border p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-accent text-accent-foreground font-bold text-xl">
            {level}
          </div>
          <div>
            <p className="font-semibold">Level {level}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {xpTotal.toLocaleString()} XP
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Next level</p>
          <p className="font-medium text-accent">{xpForNextLevel.toLocaleString()} XP</p>
        </div>
      </div>
      <Progress value={xpProgress} className="h-3" />
      <p className="text-xs text-muted-foreground mt-2 text-center">
        {Math.round(xpProgress)}% to Level {level + 1}
      </p>
    </div>
  );
}
