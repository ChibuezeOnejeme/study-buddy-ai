import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface BadgeCardProps {
  name: string;
  description: string;
  icon: string;
  category: 'learning' | 'consistency' | 'mastery' | 'social';
  isEarned: boolean;
  earnedAt?: string;
  xpReward?: number;
  isProOnly?: boolean;
  compact?: boolean;
  className?: string;
}

const categoryColors = {
  learning: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  consistency: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  mastery: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  social: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
};

const categoryGradients = {
  learning: 'from-blue-500 to-cyan-500',
  consistency: 'from-orange-500 to-yellow-500',
  mastery: 'from-purple-500 to-pink-500',
  social: 'from-green-500 to-emerald-500',
};

export function BadgeCard({
  name,
  description,
  icon,
  category,
  isEarned,
  earnedAt,
  xpReward,
  isProOnly = false,
  compact = false,
  className,
}: BadgeCardProps) {
  // Dynamically get the icon component
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[icon] || LucideIcons.Award;

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full transition-all",
            isEarned
              ? cn("bg-gradient-to-br", categoryGradients[category], "text-white shadow-md")
              : "bg-muted text-muted-foreground opacity-50",
            className
          )}>
            {isEarned ? (
              <IconComponent className="w-5 h-5" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          {!isEarned && xpReward && (
            <p className="text-xs text-accent">+{xpReward} XP when earned</p>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={cn(
      "relative bg-card rounded-xl border p-4 transition-all",
      isEarned ? "border-accent/50 shadow-md" : "border-border opacity-75",
      className
    )}>
      {isProOnly && !isEarned && (
        <span className="absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent/20 text-accent">
          PRO
        </span>
      )}
      
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex items-center justify-center w-12 h-12 rounded-xl",
          isEarned
            ? cn("bg-gradient-to-br", categoryGradients[category], "text-white")
            : categoryColors[category]
        )}>
          {isEarned ? (
            <IconComponent className="w-6 h-6" />
          ) : (
            <Lock className="w-5 h-5 opacity-50" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={cn("font-semibold", !isEarned && "text-muted-foreground")}>
            {name}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
          {isEarned && earnedAt && (
            <p className="text-xs text-accent mt-1">
              Earned {new Date(earnedAt).toLocaleDateString()}
            </p>
          )}
          {!isEarned && xpReward && (
            <p className="text-xs text-muted-foreground mt-1">
              +{xpReward} XP
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
