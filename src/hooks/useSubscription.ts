import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { PLAN_LIMITS, PlanType, PlanLimits, FeatureName } from '@/lib/planLimits';

interface Subscription {
  id: string;
  user_id: string;
  plan: PlanType;
  status: string;
  dev_mode: boolean;
  current_period_start: string;
  current_period_end: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export function useSubscription() {
  const { user } = useAuth();

  const { data: subscription, isLoading, error } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      // Map database plan to our PlanType (handle legacy 'plus' as 'free')
      if (data) {
        const plan = data.plan === 'plus' ? 'free' : data.plan;
        return { ...data, plan } as Subscription;
      }
      return null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Determine effective plan (Pro if dev_mode is enabled)
  const plan: PlanType = subscription?.plan || 'free';
  const effectivePlan: PlanType = subscription?.dev_mode ? 'pro' : plan;
  const isDevMode = subscription?.dev_mode ?? false;
  const limits: PlanLimits = PLAN_LIMITS[effectivePlan];

  // Feature check helpers
  const canUseFeature = (feature: FeatureName): boolean => {
    const value = limits[feature];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    return false;
  };

  const getLimit = (feature: FeatureName): number => {
    const value = limits[feature];
    if (typeof value === 'number') return value;
    return 0;
  };

  const isUnlimited = (feature: FeatureName): boolean => {
    const value = limits[feature];
    return value === Infinity;
  };

  return {
    subscription,
    isLoading,
    error,
    plan,
    effectivePlan,
    isDevMode,
    limits,
    canUseFeature,
    getLimit,
    isUnlimited,
    isPro: effectivePlan === 'pro',
    isFree: effectivePlan === 'free',
  };
}
