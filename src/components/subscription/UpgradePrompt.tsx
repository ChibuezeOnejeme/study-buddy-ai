import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Sparkles, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PlanType, FeatureName, FEATURE_DESCRIPTIONS, PLAN_NAMES } from '@/lib/planLimits';
import { cn } from '@/lib/utils';

interface UpgradePromptProps {
  feature: FeatureName;
  currentPlan: PlanType;
  message?: string;
  variant?: 'inline' | 'card' | 'banner';
  className?: string;
}

// Determine minimum plan required for a feature (simplified to free/pro)
function getRequiredPlan(feature: FeatureName): PlanType {
  const proFeatures: FeatureName[] = [
    'timedExams', 'streakProtection', 'xpBoosts',
    'verifiedExams', 'realWorldRewards', 'mockCreation', 'mockSharing'
  ];
  
  if (proFeatures.includes(feature)) return 'pro';
  return 'free';
}

const planIcons = {
  free: Sparkles,
  pro: Crown,
};

export function UpgradePrompt({
  feature,
  currentPlan,
  message,
  variant = 'card',
  className,
}: UpgradePromptProps) {
  const requiredPlan = getRequiredPlan(feature);
  const RequiredIcon = planIcons[requiredPlan];
  const featureDescription = FEATURE_DESCRIPTIONS[feature];
  
  const defaultMessage = `Upgrade to ${PLAN_NAMES[requiredPlan]} to unlock ${featureDescription.toLowerCase()}.`;
  const displayMessage = message || defaultMessage;

  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Lock className="w-4 h-4" />
        <span>{displayMessage}</span>
        <Button variant="link" size="sm" className="h-auto p-0" asChild>
          <Link to="/pricing">Upgrade</Link>
        </Button>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={cn(
        "flex items-center justify-between gap-4 p-4 rounded-lg bg-accent/10 border border-accent/20",
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/20">
            <Lock className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="font-medium">{featureDescription}</p>
            <p className="text-sm text-muted-foreground">{displayMessage}</p>
          </div>
        </div>
        <Button variant="hero" size="sm" asChild>
          <Link to="/pricing">
            <RequiredIcon className="w-4 h-4 mr-1" />
            Upgrade to {PLAN_NAMES[requiredPlan]}
          </Link>
        </Button>
      </div>
    );
  }

  // Default: card variant
  return (
    <Card className={cn("border-accent/20", className)}>
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-2">
          <Lock className="w-6 h-6 text-accent" />
        </div>
        <CardTitle className="text-lg">{featureDescription}</CardTitle>
        <CardDescription>{displayMessage}</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button variant="hero" asChild>
          <Link to="/pricing">
            <RequiredIcon className="w-4 h-4 mr-2" />
            Upgrade to {PLAN_NAMES[requiredPlan]}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
