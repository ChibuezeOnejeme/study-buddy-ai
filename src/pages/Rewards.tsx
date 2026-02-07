import { DashboardLayout } from '@/components/layout/DashboardLayout';
 import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGamification } from '@/hooks/useGamification';
import { useSubscription } from '@/hooks/useSubscription';
import { useFeatureUnlock } from '@/hooks/useFeatureUnlock';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Lock, Gift, Sparkles, CheckCircle, Loader2 } from 'lucide-react';
import { LockedPage } from '@/components/ui/locked-feature';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Reward {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string | null;
  xp_cost: number;
  category: 'digital' | 'real_world';
  is_pro_only: boolean;
  is_active: boolean;
}

interface UserReward {
  id: string;
  reward_id: string;
  claimed_at: string;
  status: 'pending' | 'fulfilled' | 'expired';
}

const Rewards = () => {
   const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { xpTotal } = useGamification();
  const { isPro, canUseFeature } = useSubscription();
  const { milestones, isLoading: loadingMilestones } = useFeatureUnlock();

  // Fetch all rewards
  const { data: rewards = [], isLoading: loadingRewards } = useQuery({
    queryKey: ['rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('xp_cost', { ascending: true });
      
      if (error) throw error;
      return data as Reward[];
    },
  });

  // Fetch user's claimed rewards
  const { data: userRewards = [], isLoading: loadingUserRewards } = useQuery({
    queryKey: ['user_rewards', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_rewards')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as UserReward[];
    },
    enabled: !!user?.id,
  });

  const claimedRewardIds = new Set(userRewards.map(ur => ur.reward_id));

  // Claim reward mutation
  const claimRewardMutation = useMutation({
    mutationFn: async (reward: Reward) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (xpTotal < reward.xp_cost) throw new Error('Not enough XP');
      if (reward.is_pro_only && !isPro) throw new Error('Pro plan required');
      
      const { error } = await supabase
        .from('user_rewards')
        .insert([{
          user_id: user.id,
          reward_id: reward.id,
          status: 'pending',
        }]);
      
      if (error) throw error;
      
      // Deduct XP (simplified - in production you'd want a transaction)
      const { error: updateError } = await supabase
        .from('user_gamification')
        .update({ xp_total: xpTotal - reward.xp_cost })
        .eq('user_id', user.id);
      
      if (updateError) throw updateError;
      
      return reward;
    },
    onSuccess: (reward) => {
      toast.success(`🎁 Claimed ${reward.name}!`);
      queryClient.invalidateQueries({ queryKey: ['user_rewards', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['gamification', user?.id] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isLoading = loadingRewards || loadingUserRewards;

  const digitalRewards = rewards.filter(r => r.category === 'digital');

  // Check if feature is locked - after all hooks
  if (!loadingMilestones && !milestones?.first_upload_completed) {
    return (
      <DashboardLayout>
        <LockedPage 
           title={t('rewards.locked')} 
           description={t('rewards.lockedDesc')}
        />
      </DashboardLayout>
    );
  }

  const RewardCard = ({ reward }: { reward: Reward }) => {
    const isClaimed = claimedRewardIds.has(reward.id);
    const canAfford = xpTotal >= reward.xp_cost;
    const canClaim = canAfford && !isClaimed && (!reward.is_pro_only || isPro);

    return (
      <Card className={cn(
        "relative overflow-hidden transition-all",
        isClaimed && "border-success/50 bg-success/5",
        !canAfford && !isClaimed && "opacity-75"
      )}>
        {reward.is_pro_only && !isPro && (
          <div className="absolute top-2 right-2 bg-accent/20 text-accent text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Lock className="w-3 h-3" />
            PRO
          </div>
        )}
        
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl",
              isClaimed
                ? "bg-success/20 text-success"
                : "bg-accent/20 text-accent"
            )}>
              {isClaimed ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <Gift className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">{reward.name}</CardTitle>
              <CardDescription className="text-sm mt-1">
                {reward.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-accent font-bold">
              <Sparkles className="w-4 h-4" />
              {reward.xp_cost.toLocaleString()} XP
            </div>
            
            {isClaimed ? (
              <span className="text-sm text-success font-medium">Claimed ✓</span>
            ) : (
              <Button
                size="sm"
                variant={canClaim ? "hero" : "outline"}
                disabled={!canClaim || claimRewardMutation.isPending}
                onClick={() => claimRewardMutation.mutate(reward)}
              >
                {claimRewardMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : !canAfford ? (
                  'Not enough XP'
                ) : reward.is_pro_only && !isPro ? (
                  'Pro Only'
                ) : (
                  'Claim'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
             <h1 className="font-display text-3xl font-bold mb-2">{t('rewards.title')}</h1>
            <p className="text-muted-foreground">
               {t('rewards.description')}
            </p>
          </div>
          <div className="text-right">
             <p className="text-sm text-muted-foreground">{t('rewards.yourXP')}</p>
            <p className="text-2xl font-bold text-accent flex items-center gap-1">
              <Sparkles className="w-5 h-5" />
              {xpTotal.toLocaleString()} XP
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Digital Rewards */}
            <section className="mb-10">
             <h2 className="text-xl font-semibold mb-4">{t('rewards.availableRewards')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {digitalRewards.map((reward) => (
                  <RewardCard key={reward.id} reward={reward} />
                ))}
              </div>
              {digitalRewards.length === 0 && (
                <div className="text-center py-12 bg-card rounded-2xl border border-border">
                  <p className="text-muted-foreground">No rewards available yet. Keep earning XP!</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Rewards;
