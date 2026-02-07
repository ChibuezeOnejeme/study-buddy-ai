import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { calculateLevel } from '@/lib/planLimits';

export type MasteryLevel = 'novice' | 'learning' | 'proficient' | 'master';

export interface TopicMastery {
  id: string;
  user_id: string;
  topic_id: string;
  mastery_level: MasteryLevel;
  flashcard_mastery_pct: number;
  question_accuracy_pct: number;
  tests_completed: number;
  verified_exam_passed: boolean;
  xp_earned: number;
  created_at: string;
  updated_at: string;
}

export interface TopicWithMastery {
  topicId: string;
  topicName: string;
  xpEarned: number;
  level: number;
  masteryLevel: MasteryLevel;
}

/**
 * Calculate mastery level based on XP and performance metrics
 */
export function calculateMasteryLevel(stats: {
  xpEarned: number;
  questionAccuracy: number;
  testsCompleted: number;
  flashcardsReviewed?: number;
}): MasteryLevel {
  const { xpEarned, questionAccuracy, testsCompleted, flashcardsReviewed = 0 } = stats;
  
  // Master: 1000+ XP AND 90%+ accuracy AND 3+ tests
  if (xpEarned >= 1000 && questionAccuracy >= 90 && testsCompleted >= 3) {
    return 'master';
  }
  
  // Proficient: 300+ XP AND 80%+ accuracy
  if (xpEarned >= 300 && questionAccuracy >= 80) {
    return 'proficient';
  }
  
  // Learning: 50+ XP OR 5+ flashcards reviewed
  if (xpEarned >= 50 || flashcardsReviewed >= 5) {
    return 'learning';
  }
  
  return 'novice';
}

export function useTopicMastery(topicId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch mastery data for a specific topic or all topics
  const { data: masteryData, isLoading } = useQuery({
    queryKey: ['topic_mastery', user?.id, topicId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('topic_mastery')
        .select('*')
        .eq('user_id', user.id);
      
      if (topicId) {
        query = query.eq('topic_id', topicId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as TopicMastery[];
    },
    enabled: !!user?.id,
  });

  // Fetch XP events by topic for aggregated stats
  const { data: topicXPEvents = [] } = useQuery({
    queryKey: ['xp_events_by_topic', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('xp_events')
        .select('topic_id, xp_amount')
        .eq('user_id', user.id)
        .not('topic_id', 'is', null);
      
      if (error) throw error;
      return data as { topic_id: string; xp_amount: number }[];
    },
    enabled: !!user?.id,
  });

  // Calculate XP per topic from events
  const xpByTopic = topicXPEvents.reduce((acc, event) => {
    if (event.topic_id) {
      acc[event.topic_id] = (acc[event.topic_id] || 0) + event.xp_amount;
    }
    return acc;
  }, {} as Record<string, number>);

  // Get single topic mastery
  const singleMastery = topicId && masteryData?.length 
    ? masteryData[0] 
    : null;

  // Calculate topic level from XP
  const topicXP = topicId ? (xpByTopic[topicId] || singleMastery?.xp_earned || 0) : 0;
  const topicLevel = calculateLevel(topicXP);

  // Get or calculate mastery level
  const masteryLevel = singleMastery?.mastery_level || 'novice';

  // Update topic mastery mutation
  const updateMasteryMutation = useMutation({
    mutationFn: async (data: {
      topicId: string;
      xpEarned?: number;
      questionAccuracy?: number;
      testsCompleted?: number;
      flashcardMastery?: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Check if mastery record exists
      const { data: existing } = await supabase
        .from('topic_mastery')
        .select('*')
        .eq('user_id', user.id)
        .eq('topic_id', data.topicId)
        .maybeSingle();
      
      const newXP = (existing?.xp_earned || 0) + (data.xpEarned || 0);
      const accuracy = data.questionAccuracy ?? existing?.question_accuracy_pct ?? 0;
      const tests = data.testsCompleted ?? existing?.tests_completed ?? 0;
      const flashcardMastery = data.flashcardMastery ?? existing?.flashcard_mastery_pct ?? 0;
      
      const newMasteryLevel = calculateMasteryLevel({
        xpEarned: newXP,
        questionAccuracy: accuracy,
        testsCompleted: tests,
      });
      
      if (existing) {
        const { error } = await supabase
          .from('topic_mastery')
          .update({
            xp_earned: newXP,
            question_accuracy_pct: accuracy,
            tests_completed: tests,
            flashcard_mastery_pct: flashcardMastery,
            mastery_level: newMasteryLevel,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('topic_mastery')
          .insert({
            user_id: user.id,
            topic_id: data.topicId,
            xp_earned: newXP,
            question_accuracy_pct: accuracy,
            tests_completed: tests,
            flashcard_mastery_pct: flashcardMastery,
            mastery_level: newMasteryLevel,
          });
        
        if (error) throw error;
      }
      
      return { newMasteryLevel, newXP };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic_mastery', user?.id] });
    },
  });

  return {
    mastery: singleMastery,
    allMastery: masteryData || [],
    topicXP,
    topicLevel,
    masteryLevel,
    xpByTopic,
    isLoading,
    updateMastery: updateMasteryMutation.mutateAsync,
  };
}

// Hook to get topics ranked by XP
export function useTopicLeaderboard(limit = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['topic_leaderboard', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get topics with their mastery data
      const { data: topics, error: topicsError } = await supabase
        .from('topics')
        .select('id, name')
        .eq('user_id', user.id);
      
      if (topicsError) throw topicsError;
      
      // Get XP events grouped by topic
      const { data: xpEvents, error: xpError } = await supabase
        .from('xp_events')
        .select('topic_id, xp_amount')
        .eq('user_id', user.id)
        .not('topic_id', 'is', null);
      
      if (xpError) throw xpError;
      
      // Get mastery data
      const { data: masteryData, error: masteryError } = await supabase
        .from('topic_mastery')
        .select('topic_id, xp_earned, mastery_level')
        .eq('user_id', user.id);
      
      if (masteryError) throw masteryError;
      
      // Aggregate XP by topic
      const xpByTopic = xpEvents.reduce((acc, event) => {
        if (event.topic_id) {
          acc[event.topic_id] = (acc[event.topic_id] || 0) + event.xp_amount;
        }
        return acc;
      }, {} as Record<string, number>);
      
      // Merge with mastery cached XP (use whichever is higher)
      const masteryByTopic = masteryData.reduce((acc, m) => {
        acc[m.topic_id] = m;
        return acc;
      }, {} as Record<string, { xp_earned: number; mastery_level: MasteryLevel }>);
      
      // Build leaderboard
      const leaderboard: TopicWithMastery[] = topics.map(topic => {
        const xpFromEvents = xpByTopic[topic.id] || 0;
        const xpFromMastery = masteryByTopic[topic.id]?.xp_earned || 0;
        const xpEarned = Math.max(xpFromEvents, xpFromMastery);
        
        return {
          topicId: topic.id,
          topicName: topic.name,
          xpEarned,
          level: calculateLevel(xpEarned),
          masteryLevel: masteryByTopic[topic.id]?.mastery_level || 'novice',
        };
      });
      
      // Sort by XP descending and limit
      return leaderboard
        .filter(t => t.xpEarned > 0)
        .sort((a, b) => b.xpEarned - a.xpEarned)
        .slice(0, limit);
    },
    enabled: !!user?.id,
  });
}
