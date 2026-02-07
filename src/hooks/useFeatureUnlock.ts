import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useQuestions } from './useQuestions';

export type UnlockableFeature = 
  | 'flashcards'
  | 'practice'
  | 'tests'
  | 'planner';

interface FeatureUnlockState {
  first_upload_completed: boolean;
  first_flashcard_reviewed: boolean;
  first_test_completed: boolean;
  created_at: string;
}

interface UnlockProgress {
  flashcardsUnlocked: boolean;
  practiceUnlocked: boolean;
  testsUnlocked: boolean;
  plannerUnlocked: boolean;
}

export function useFeatureUnlock() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: questions = [] } = useQuestions();

  const { data: milestones, isLoading } = useQuery({
    queryKey: ['feature-milestones', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('first_upload_completed, first_flashcard_reviewed, first_test_completed, created_at')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data as FeatureUnlockState;
    },
    enabled: !!user,
  });

  const unlockMutation = useMutation({
    mutationFn: async (milestone: 'first_upload_completed' | 'first_flashcard_reviewed' | 'first_test_completed') => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('profiles')
        .update({ [milestone]: true })
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-milestones', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  // Calculate unlock states
  const answeredQuestionsCount = questions.filter(q => q.answered_correctly !== null).length;
  const daysSinceSignup = milestones?.created_at 
    ? Math.floor((Date.now() - new Date(milestones.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const progress: UnlockProgress = {
    // Flashcards unlock after first upload
    flashcardsUnlocked: milestones?.first_upload_completed ?? false,
    // Practice unlocks after first flashcard review
    practiceUnlocked: milestones?.first_flashcard_reviewed ?? false,
    // Tests unlock after 10+ practice questions answered
    testsUnlocked: answeredQuestionsCount >= 10,
    // Planner unlocks after first test OR 7+ days since signup
    plannerUnlocked: (milestones?.first_test_completed ?? false) || daysSinceSignup >= 7,
  };

  const isUnlocked = (feature: UnlockableFeature): boolean => {
    switch (feature) {
      case 'flashcards':
        return progress.flashcardsUnlocked;
      case 'practice':
        return progress.practiceUnlocked;
      case 'tests':
        return progress.testsUnlocked;
      case 'planner':
        return progress.plannerUnlocked;
      default:
        return false;
    }
  };

  const getUnlockHint = (feature: UnlockableFeature): string => {
    switch (feature) {
      case 'flashcards':
        return 'Upload your first study material to unlock';
      case 'practice':
        return 'Review a flashcard to unlock';
      case 'tests':
        return `Answer ${10 - answeredQuestionsCount} more practice questions to unlock`;
      case 'planner':
        return 'Complete a test or use the app for 7 days to unlock';
      default:
        return '';
    }
  };

  const unlockFeature = async (milestone: 'first_upload_completed' | 'first_flashcard_reviewed' | 'first_test_completed') => {
    // Only unlock if not already unlocked
    if (milestones?.[milestone]) return;
    await unlockMutation.mutateAsync(milestone);
  };

  return {
    isUnlocked,
    getUnlockHint,
    unlockFeature,
    progress,
    milestones,
    isLoading,
  };
}
