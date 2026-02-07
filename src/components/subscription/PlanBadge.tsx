import { cn } from '@/lib/utils';
import { Crown, Sparkles, Zap } from 'lucide-react';
import { PlanType, PLAN_NAMES } from '@/lib/planLimits';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PlanBadgeProps {
  plan: PlanType;
  isDevMode?: boolean;
  showLabel?: boolean;
  className?: string;
}

const planIcons = {
  free: Sparkles,
  plus: Zap,
  pro: Crown,
};

const planColors = {
  free: 'bg-secondary text-secondary-foreground',
  plus: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  pro: 'bg-gradient-accent text-accent-foreground',
};

export function PlanBadge({ plan, isDevMode = false, showLabel = true, className }: PlanBadgeProps) {
  const Icon = planIcons[plan];
  
  const badge = (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
      planColors[plan],
      className
    )}>
      <Icon className="w-3.5 h-3.5" />
      {showLabel && <span>{PLAN_NAMES[plan]}</span>}
      {isDevMode && (
        <span className="text-[10px] opacity-75 ml-0.5">(DEV)</span>
      )}
    </div>
  );

  if (isDevMode) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>Dev Mode Active</p>
          <p className="text-xs text-muted-foreground">All Pro features unlocked for testing</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}
