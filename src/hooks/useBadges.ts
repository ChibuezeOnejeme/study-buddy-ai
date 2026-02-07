import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: 'learning' | 'consistency' | 'mastery' | 'social';
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  is_pro_only: boolean;
}

interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export function useBadges() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all available badges
  const { data: allBadges = [], isLoading: loadingBadges } = useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data as Badge[];
    },
    staleTime: 60 * 60 * 1000, // 1 hour - badges don't change often
  });

  // Fetch user's earned badges
  const { data: userBadges = [], isLoading: loadingUserBadges } = useQuery({
    queryKey: ['user_badges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_badges')
        .select('*, badge:badges(*)')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });
      
      if (error) throw error;
      return data as (UserBadge & { badge: Badge })[];
    },
    enabled: !!user?.id,
  });

  // Get earned badge IDs
  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));

  // Split badges into earned and available
  const earnedBadges = userBadges.map(ub => ub.badge).filter(Boolean) as Badge[];
  const availableBadges = allBadges.filter(b => !earnedBadgeIds.has(b.id));

  // Get most recently earned badge
  const recentBadge = userBadges.length > 0 ? userBadges[0].badge : null;

  // Award badge mutation
  const awardBadgeMutation = useMutation({
    mutationFn: async (badgeSlug: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const badge = allBadges.find(b => b.slug === badgeSlug);
      if (!badge) throw new Error('Badge not found');
      
      // Check if already earned
      if (earnedBadgeIds.has(badge.id)) {
        return { alreadyEarned: true, badge };
      }
      
      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: user.id,
          badge_id: badge.id,
        });
      
      if (error) throw error;
      
      return { alreadyEarned: false, badge };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_badges', user?.id] });
    },
  });

  // Check and award badges based on stats (now includes topic-specific badges)
  const checkBadges = async (stats: {
    flashcardsReviewed?: number;
    flashcardsMastered?: number;
    questionsCorrect?: number;
    streakDays?: number;
    testsCompleted?: number;
    perfectTests?: number;
    fastTests?: number;
    // Topic-specific stats
    topicMasteryLevels?: Record<string, 'novice' | 'learning' | 'proficient' | 'master'>;
    topicXP?: Record<string, number>;
    topicStreaks?: Record<string, number>;
  }) => {
    const newBadges: Badge[] = [];
    
    for (const badge of availableBadges) {
      let shouldAward = false;
      
      switch (badge.requirement_type) {
        case 'flashcard_reviewed':
          if (stats.flashcardsReviewed && stats.flashcardsReviewed >= badge.requirement_value) {
            shouldAward = true;
          }
          break;
        case 'flashcard_mastered':
          if (stats.flashcardsMastered && stats.flashcardsMastered >= badge.requirement_value) {
            shouldAward = true;
          }
          break;
        case 'questions_correct':
          if (stats.questionsCorrect && stats.questionsCorrect >= badge.requirement_value) {
            shouldAward = true;
          }
          break;
        case 'streak_days':
          if (stats.streakDays && stats.streakDays >= badge.requirement_value) {
            shouldAward = true;
          }
          break;
        case 'tests_completed':
          if (stats.testsCompleted && stats.testsCompleted >= badge.requirement_value) {
            shouldAward = true;
          }
          break;
        case 'perfect_test':
          if (stats.perfectTests && stats.perfectTests >= badge.requirement_value) {
            shouldAward = true;
          }
          break;
        case 'fast_test':
          if (stats.fastTests && stats.fastTests >= badge.requirement_value) {
            shouldAward = true;
          }
          break;
        // Topic-specific badge types
        case 'topic_mastery_level':
          // Check if any topic has reached Master level (level 4)
          if (stats.topicMasteryLevels) {
            const hasMaster = Object.values(stats.topicMasteryLevels).some(
              level => level === 'master'
            );
            if (hasMaster) shouldAward = true;
          }
          break;
        case 'topic_xp':
          // Check if any topic has reached the required XP (e.g., 1000)
          if (stats.topicXP) {
            const hasEnoughXP = Object.values(stats.topicXP).some(
              xp => xp >= badge.requirement_value
            );
            if (hasEnoughXP) shouldAward = true;
          }
          break;
        case 'proficient_topics':
          // Check if enough topics have reached Proficient or Master
          if (stats.topicMasteryLevels) {
            const proficientCount = Object.values(stats.topicMasteryLevels).filter(
              level => level === 'proficient' || level === 'master'
            ).length;
            if (proficientCount >= badge.requirement_value) shouldAward = true;
          }
          break;
        case 'topic_streak':
          // Check if any topic has been studied for required consecutive days
          if (stats.topicStreaks) {
            const hasStreak = Object.values(stats.topicStreaks).some(
              streak => streak >= badge.requirement_value
            );
            if (hasStreak) shouldAward = true;
          }
          break;
      }
      
      if (shouldAward) {
        const result = await awardBadgeMutation.mutateAsync(badge.slug);
        if (!result.alreadyEarned) {
          newBadges.push(badge);
        }
      }
    }
    
    return newBadges;
  };

  return {
    allBadges,
    earnedBadges,
    availableBadges,
    recentBadge,
    isLoading: loadingBadges || loadingUserBadges,
    checkBadges,
    awardBadge: awardBadgeMutation.mutateAsync,
  };
}
