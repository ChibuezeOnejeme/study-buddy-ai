import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface UsageLimitBannerProps {
  type: 'uploads' | 'mockTests';
  used: number;
  limit: number;
  className?: string;
}

export function UsageLimitBanner({ type, used, limit, className }: UsageLimitBannerProps) {
  const isUnlimited = limit === Infinity;
  const remaining = isUnlimited ? Infinity : limit - used;
  const percentage = isUnlimited ? 0 : (used / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = remaining <= 0;

  const labels = {
    uploads: { singular: 'upload', plural: 'uploads' },
    mockTests: { singular: 'mock test', plural: 'mock tests' },
  };

  const label = labels[type];

  if (isUnlimited) {
    return null; // Don't show banner for unlimited usage
  }

  if (isAtLimit) {
    return (
      <div className={cn(
        "flex items-center justify-between gap-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20",
        className
      )}>
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">
            Weekly {label.plural} limit reached ({used}/{limit})
          </span>
        </div>
        <Button variant="destructive" size="sm" asChild>
          <Link to="/pricing">Upgrade for Unlimited</Link>
        </Button>
      </div>
    );
  }

  if (isNearLimit) {
    return (
      <div className={cn(
        "flex items-center justify-between gap-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20",
        className
      )}>
        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">
            {remaining} {remaining === 1 ? label.singular : label.plural} remaining this week
          </span>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/pricing">Get Unlimited</Link>
        </Button>
      </div>
    );
  }

  // Low usage - show subtle indicator
  return (
    <div className={cn(
      "flex items-center gap-2 text-sm text-muted-foreground",
      className
    )}>
      <CheckCircle className="w-4 h-4 text-success shrink-0" />
      <span>
        {remaining} {remaining === 1 ? label.singular : label.plural} remaining this week
      </span>
    </div>
  );
}
