import { cn } from '@/lib/utils';
import { Flame, Shield } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  streakProtectionAvailable?: boolean;
  compact?: boolean;
  className?: string;
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  streakProtectionAvailable = false,
  compact = false,
  className,
}: StreakDisplayProps) {
  // Determine flame intensity based on streak length
  const getFlameColor = () => {
    if (currentStreak >= 100) return 'text-purple-500';
    if (currentStreak >= 30) return 'text-orange-500';
    if (currentStreak >= 7) return 'text-yellow-500';
    return 'text-orange-400';
  };

  const getFlameSize = () => {
    if (currentStreak >= 30) return 'w-6 h-6';
    if (currentStreak >= 7) return 'w-5 h-5';
    return 'w-4 h-4';
  };

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-1.5 cursor-default", className)}>
            <Flame className={cn(getFlameSize(), getFlameColor(), currentStreak > 0 && "animate-pulse")} />
            <span className="font-bold text-sm">{currentStreak}</span>
            {streakProtectionAvailable && (
              <Shield className="w-3 h-3 text-success" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{currentStreak} day streak</p>
          <p className="text-xs text-muted-foreground">Best: {longestStreak} days</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={cn("bg-card rounded-xl border border-border p-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center justify-center w-12 h-12 rounded-full",
            currentStreak > 0 ? "bg-orange-100 dark:bg-orange-900/30" : "bg-muted"
          )}>
            <Flame className={cn(
              getFlameSize(),
              currentStreak > 0 ? getFlameColor() : "text-muted-foreground",
              currentStreak > 0 && "animate-pulse"
            )} />
          </div>
          <div>
            <p className="font-semibold text-lg">{currentStreak} day streak</p>
            <p className="text-sm text-muted-foreground">
              Best: {longestStreak} days
            </p>
          </div>
        </div>
        {streakProtectionAvailable && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-success bg-success/10 px-2 py-1 rounded-full">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-medium">Protected</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Streak protection available</p>
              <p className="text-xs text-muted-foreground">Miss 1 day/week without losing your streak</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {currentStreak > 0 && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          {currentStreak < 7 
            ? `${7 - currentStreak} days until Week Warrior badge!`
            : currentStreak < 30 
            ? `${30 - currentStreak} days until Monthly Master badge!`
            : "🔥 You're on fire! Keep it going!"}
        </p>
      )}
    </div>
  );
}
