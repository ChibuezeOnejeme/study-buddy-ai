import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface Question {
  id: string;
  user_id: string;
  topic_id: string | null;
  question: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  answered_correctly: boolean | null;
  last_attempted_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useQuestions(topicId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['questions', user?.id, topicId],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('questions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (topicId) {
        query = query.eq('topic_id', topicId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Question[];
    },
    enabled: !!user,
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (question: { 
      question: string; 
      correct_answer: string; 
      options?: string[]; 
      explanation?: string;
      topic_id?: string 
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('questions')
        .insert({ ...question, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', user?.id] });
    },
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Question> & { id: string }) => {
      const { data, error } = await supabase
        .from('questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', user?.id] });
    },
  });
}

export function useBulkCreateQuestions() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (questions: { 
      question: string; 
      correct_answer: string; 
      options?: string[]; 
      explanation?: string;
      topic_id?: string 
    }[]) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('questions')
        .insert(questions.map(q => ({ ...q, user_id: user.id })))
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', user?.id] });
    },
  });
}
