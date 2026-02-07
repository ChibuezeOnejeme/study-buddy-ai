import { DashboardLayout } from '@/components/layout/DashboardLayout';
 import { useTranslation } from 'react-i18next';
import { BadgeCard } from '@/components/gamification/BadgeCard';
import { useBadges } from '@/hooks/useBadges';
import { useGamification } from '@/hooks/useGamification';
import { useFeatureUnlock } from '@/hooks/useFeatureUnlock';
import { XPProgressBar } from '@/components/gamification/XPProgressBar';
import { StreakDisplay } from '@/components/gamification/StreakDisplay';
import { LockedPage } from '@/components/ui/locked-feature';
import { useSubscription } from '@/hooks/useSubscription';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Award, Trophy, Flame, Target, Users } from 'lucide-react';

const categoryIcons = {
  learning: Trophy,
  consistency: Flame,
  mastery: Target,
  social: Users,
};

const categoryLabels = {
  learning: 'Learning',
  consistency: 'Consistency',
  mastery: 'Mastery',
  social: 'Social',
};

const Achievements = () => {
   const { t } = useTranslation();
  // All hooks called unconditionally at the top
  const { milestones, isLoading: loadingMilestones } = useFeatureUnlock();
  const { allBadges, earnedBadges, isLoading: loadingBadges } = useBadges();
  const { xpTotal, level, xpProgress, xpForNextLevel, currentStreak, longestStreak, isLoading: loadingGamification } = useGamification();
  const { canUseFeature } = useSubscription();

  const isLoading = loadingBadges || loadingGamification;

  // Get user badges for earned dates
  const earnedBadgeIds = new Set(earnedBadges.map(b => b.id));

  // Group badges by category
  const badgesByCategory = allBadges.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = [];
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, typeof allBadges>);

  const categories = Object.keys(badgesByCategory) as Array<keyof typeof categoryLabels>;

  // Check if feature is locked - after all hooks
  if (!loadingMilestones && !milestones?.first_upload_completed) {
    return (
      <DashboardLayout>
        <LockedPage 
           title={t('achievements.locked')} 
           description={t('achievements.lockedDesc')}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8">
        <div className="mb-8">
           <h1 className="font-display text-3xl font-bold mb-2">{t('achievements.title')}</h1>
          <p className="text-muted-foreground">
             {t('achievements.description')}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <XPProgressBar
                level={level}
                xpTotal={xpTotal}
                xpProgress={xpProgress}
                xpForNextLevel={xpForNextLevel}
              />
              <StreakDisplay
                currentStreak={currentStreak}
                longestStreak={longestStreak}
                streakProtectionAvailable={canUseFeature('streakProtection')}
              />
              <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/20">
                  <Award className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{earnedBadges.length}</p>
                  <p className="text-sm text-muted-foreground">
                    of {allBadges.length} badges earned
                  </p>
                </div>
              </div>
            </div>

            {/* Badges by Category */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-6 flex-wrap h-auto gap-2">
                <TabsTrigger value="all" className="gap-2">
                  <Award className="w-4 h-4" />
                  All
                </TabsTrigger>
                {categories.map((category) => {
                  const Icon = categoryIcons[category];
                  return (
                    <TabsTrigger key={category} value={category} className="gap-2">
                      <Icon className="w-4 h-4" />
                      {categoryLabels[category]}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <TabsContent value="all">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allBadges.map((badge) => (
                    <BadgeCard
                      key={badge.id}
                      name={badge.name}
                      description={badge.description}
                      icon={badge.icon}
                      category={badge.category as 'learning' | 'consistency' | 'mastery' | 'social'}
                      isEarned={earnedBadgeIds.has(badge.id)}
                      xpReward={badge.xp_reward}
                      isProOnly={badge.is_pro_only}
                    />
                  ))}
                </div>
              </TabsContent>

              {categories.map((category) => (
                <TabsContent key={category} value={category}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {badgesByCategory[category]?.map((badge) => (
                      <BadgeCard
                        key={badge.id}
                        name={badge.name}
                        description={badge.description}
                        icon={badge.icon}
                        category={badge.category as 'learning' | 'consistency' | 'mastery' | 'social'}
                        isEarned={earnedBadgeIds.has(badge.id)}
                        xpReward={badge.xp_reward}
                        isProOnly={badge.is_pro_only}
                      />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Achievements;
