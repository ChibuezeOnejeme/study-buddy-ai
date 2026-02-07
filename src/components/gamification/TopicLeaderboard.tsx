import { useTopicLeaderboard } from '@/hooks/useTopicMastery';
import { TopicMasteryIndicator } from './TopicMasteryIndicator';
import { Sparkles, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface TopicLeaderboardProps {
  limit?: number;
  className?: string;
}

export function TopicLeaderboard({ limit = 5, className }: TopicLeaderboardProps) {
  const { data: leaderboard = [], isLoading } = useTopicLeaderboard(limit);

  if (isLoading) {
    return (
      <div className={cn("bg-card rounded-2xl border border-border p-6", className)}>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-warning" />
          <h3 className="font-display font-semibold">Top Topics by XP</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className={cn("bg-card rounded-2xl border border-border p-6", className)}>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-warning" />
          <h3 className="font-display font-semibold">Top Topics by XP</h3>
        </div>
        <div className="text-center py-6 text-muted-foreground">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Start studying to earn topic XP!</p>
        </div>
      </div>
    );
  }

  const maxXP = leaderboard[0]?.xpEarned || 1;

  return (
    <div className={cn("bg-card rounded-2xl border border-border p-6", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-warning" />
        <h3 className="font-display font-semibold">Top Topics by XP</h3>
      </div>
      
      <div className="space-y-3">
        {leaderboard.map((topic, index) => {
          const progress = (topic.xpEarned / maxXP) * 100;
          
          return (
            <div 
              key={topic.topicId}
              className="relative overflow-hidden rounded-lg bg-secondary/30 p-3"
            >
              {/* Progress bar background */}
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent/20 to-accent/5 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
              
              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {/* Rank badge */}
                  <span className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    index === 0 && "bg-warning/20 text-warning",
                    index === 1 && "bg-muted-foreground/20 text-muted-foreground",
                    index === 2 && "bg-orange-500/20 text-orange-500",
                    index > 2 && "bg-secondary text-muted-foreground"
                  )}>
                    {index + 1}
                  </span>
                  
                  <div className="flex flex-col">
                    <span className="font-medium text-sm truncate max-w-[120px]">
                      {topic.topicName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Level {topic.level}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <TopicMasteryIndicator level={topic.masteryLevel} showLabel={false} size="sm" />
                  <span className="text-sm font-semibold text-accent">
                    {topic.xpEarned.toLocaleString()} XP
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
