import { BadgeCard } from './BadgeCard';
import { cn } from '@/lib/utils';
import { Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: 'learning' | 'consistency' | 'mastery' | 'social';
  xp_reward: number;
  is_pro_only: boolean;
}

interface UserBadge {
  badge_id: string;
  earned_at: string;
}

interface BadgeShowcaseProps {
  earnedBadges: Badge[];
  userBadges: UserBadge[];
  maxDisplay?: number;
  showViewAll?: boolean;
  compact?: boolean;
  className?: string;
}

export function BadgeShowcase({
  earnedBadges,
  userBadges,
  maxDisplay = 5,
  showViewAll = true,
  compact = false,
  className,
}: BadgeShowcaseProps) {
  const displayBadges = earnedBadges.slice(0, maxDisplay);
  const remainingCount = earnedBadges.length - maxDisplay;

  if (earnedBadges.length === 0) {
    return (
      <div className={cn("bg-card rounded-xl border border-border p-4 text-center", className)}>
        <Award className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No badges earned yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Keep studying to unlock achievements!
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {displayBadges.map((badge) => {
          const userBadge = userBadges.find(ub => ub.badge_id === badge.id);
          return (
            <BadgeCard
              key={badge.id}
              name={badge.name}
              description={badge.description}
              icon={badge.icon}
              category={badge.category}
              isEarned={true}
              earnedAt={userBadge?.earned_at}
              compact
            />
          );
        })}
        {remainingCount > 0 && (
          <Link 
            to="/achievements" 
            className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            +{remainingCount}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={cn("bg-card rounded-xl border border-border p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Award className="w-5 h-5 text-accent" />
          Recent Badges
        </h3>
        {showViewAll && (
          <Button variant="ghost" size="sm" asChild>
            <Link to="/achievements">View All</Link>
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {displayBadges.map((badge) => {
          const userBadge = userBadges.find(ub => ub.badge_id === badge.id);
          return (
            <BadgeCard
              key={badge.id}
              name={badge.name}
              description={badge.description}
              icon={badge.icon}
              category={badge.category}
              isEarned={true}
              earnedAt={userBadge?.earned_at}
              xpReward={badge.xp_reward}
              compact
            />
          );
        })}
      </div>
      
      <p className="text-xs text-muted-foreground mt-3 text-center">
        {earnedBadges.length} badge{earnedBadges.length !== 1 ? 's' : ''} earned
      </p>
    </div>
  );
}
