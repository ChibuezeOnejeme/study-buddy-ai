import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { FeatureName } from '@/lib/planLimits';
import { UpgradePrompt } from './UpgradePrompt';

interface FeatureGateProps {
  feature: FeatureName;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
  upgradeMessage?: string;
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  upgradeMessage,
}: FeatureGateProps) {
  const { canUseFeature, effectivePlan } = useSubscription();

  if (canUseFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt) {
    return (
      <UpgradePrompt
        feature={feature}
        currentPlan={effectivePlan}
        message={upgradeMessage}
      />
    );
  }

  return null;
}
