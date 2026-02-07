import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { MasteryLevel } from '@/hooks/useTopicMastery';

interface TopicMasteryIndicatorProps {
  level: MasteryLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const MASTERY_CONFIG: Record<MasteryLevel, {
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  novice: {
    label: 'Novice',
    emoji: '🌱',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    description: 'Just getting started',
  },
  learning: {
    label: 'Learning',
    emoji: '📚',
    color: 'text-info',
    bgColor: 'bg-info/10',
    description: '50+ XP or 5+ cards reviewed',
  },
  proficient: {
    label: 'Proficient',
    emoji: '⭐',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    description: '300+ XP and 80%+ accuracy',
  },
  master: {
    label: 'Master',
    emoji: '👑',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    description: '1000+ XP, 90%+ accuracy, 3+ tests',
  },
};

const SIZE_CLASSES = {
  sm: {
    container: 'px-1.5 py-0.5 text-xs',
    emoji: 'text-sm',
  },
  md: {
    container: 'px-2 py-1 text-sm',
    emoji: 'text-base',
  },
  lg: {
    container: 'px-3 py-1.5 text-base',
    emoji: 'text-lg',
  },
};

export function TopicMasteryIndicator({ 
  level, 
  showLabel = true, 
  size = 'sm',
  className 
}: TopicMasteryIndicatorProps) {
  const config = MASTERY_CONFIG[level];
  const sizeClass = SIZE_CLASSES[size];

  const badge = (
    <div className={cn(
      "inline-flex items-center gap-1 rounded-full font-medium transition-all",
      config.bgColor,
      config.color,
      sizeClass.container,
      className
    )}>
      <span className={sizeClass.emoji}>{config.emoji}</span>
      {showLabel && <span>{config.label}</span>}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
