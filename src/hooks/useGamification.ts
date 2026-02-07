import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { calculateLevel, xpForNextLevel, xpProgressInLevel, XP_VALUES } from '@/lib/planLimits';
import { useSubscription } from './useSubscription';
import { format, differenceInDays, parseISO, startOfDay } from 'date-fns';

interface UserGamification {
  id: string;
  user_id: string;
  xp_total: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  streak_protection_used_at: string | null;
}

export type XPEventType = keyof typeof XP_VALUES;

export interface AwardXPOptions {
  eventType: XPEventType;
  topicId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}

export function useGamification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { canUseFeature, isPro } = useSubscription();

  const { data: gamification, isLoading } = useQuery({
    queryKey: ['gamification', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as UserGamification | null;
    },
    enabled: !!user?.id,
  });

  const xpTotal = gamification?.xp_total ?? 0;
  const level = calculateLevel(xpTotal);
  const xpForNext = xpForNextLevel(level);
  const xpProgress = xpProgressInLevel(xpTotal);
  const currentStreak = gamification?.current_streak ?? 0;
  const longestStreak = gamification?.longest_streak ?? 0;

  // Award XP mutation - now accepts optional topicId
  const awardXPMutation = useMutation({
    mutationFn: async ({ eventType, topicId, metadata = {} }: AwardXPOptions) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      let xpAmount = XP_VALUES[eventType];
      
      // Apply XP boost for Plus/Pro users on high scores
      if (canUseFeature('xpBoosts') && metadata.score && typeof metadata.score === 'number') {
        if (metadata.score >= 100) {
          xpAmount += XP_VALUES.score_100_bonus;
        } else if (metadata.score >= 80) {
          xpAmount += XP_VALUES.score_80_plus_bonus;
        }
      }
      
      // Insert XP event with topic_id
      const { error: eventError } = await supabase
        .from('xp_events')
        .insert([{
          user_id: user.id,
          event_type: eventType,
          xp_amount: xpAmount,
          topic_id: topicId || null,
          metadata,
        }]);
      
      if (eventError) throw eventError;
      
      // Update total XP and level (global)
      const newXpTotal = xpTotal + xpAmount;
      const newLevel = calculateLevel(newXpTotal);
      
      const { error: updateError } = await supabase
        .from('user_gamification')
        .update({
          xp_total: newXpTotal,
          level: newLevel,
        })
        .eq('user_id', user.id);
      
      if (updateError) throw updateError;
      
      // Update topic mastery XP if topic is provided
      if (topicId) {
        // Check if mastery record exists
        const { data: existing } = await supabase
          .from('topic_mastery')
          .select('id, xp_earned')
          .eq('user_id', user.id)
          .eq('topic_id', topicId)
          .maybeSingle();
        
        if (existing) {
          await supabase
            .from('topic_mastery')
            .update({ 
              xp_earned: (existing.xp_earned || 0) + xpAmount,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('topic_mastery')
            .insert({
              user_id: user.id,
              topic_id: topicId,
              xp_earned: xpAmount,
            });
        }
      }
      
      return { xpAwarded: xpAmount, newTotal: newXpTotal, newLevel, leveledUp: newLevel > level };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['topic_mastery', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['xp_events_by_topic', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['topic_leaderboard', user?.id] });
    },
  });

  // Record activity (for streak tracking)
  const recordActivityMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !gamification) throw new Error('Not authenticated');
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const lastActivity = gamification.last_activity_date;
      
      let newStreak = gamification.current_streak;
      let usedProtection = false;
      
      if (lastActivity) {
        const lastDate = startOfDay(parseISO(lastActivity));
        const todayDate = startOfDay(new Date());
        const daysDiff = differenceInDays(todayDate, lastDate);
        
        if (daysDiff === 0) {
          // Already logged today
          return { streak: newStreak, usedProtection: false };
        } else if (daysDiff === 1) {
          // Consecutive day
          newStreak += 1;
        } else if (daysDiff === 2 && isPro) {
          // Missed one day - check streak protection for Pro
          const protectionUsedAt = gamification.streak_protection_used_at;
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          
          if (!protectionUsedAt || parseISO(protectionUsedAt) < weekAgo) {
            // Use streak protection
            newStreak += 1;
            usedProtection = true;
          } else {
            // Protection already used this week
            newStreak = 1;
          }
        } else {
          // Streak broken
          newStreak = 1;
        }
      } else {
        // First activity
        newStreak = 1;
      }
      
      const updateData: Partial<UserGamification> = {
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, gamification.longest_streak),
        last_activity_date: today,
      };
      
      if (usedProtection) {
        updateData.streak_protection_used_at = today;
      }
      
      const { error } = await supabase
        .from('user_gamification')
        .update(updateData)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Award streak milestone bonuses
      if (newStreak === 7) {
        await awardXPMutation.mutateAsync({ eventType: 'streak_7_day_bonus' });
      } else if (newStreak === 30) {
        await awardXPMutation.mutateAsync({ eventType: 'streak_30_day_bonus' });
      }
      
      return { streak: newStreak, usedProtection };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification', user?.id] });
    },
  });

  return {
    gamification,
    isLoading,
    xpTotal,
    level,
    xpForNextLevel: xpForNext,
    xpProgress,
    currentStreak,
    longestStreak,
    awardXP: awardXPMutation.mutateAsync,
    recordActivity: recordActivityMutation.mutateAsync,
    isAwardingXP: awardXPMutation.isPending,
  };
}
