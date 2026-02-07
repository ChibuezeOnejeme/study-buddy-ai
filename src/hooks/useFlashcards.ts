import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface Flashcard {
  id: string;
  user_id: string;
  topic_id: string | null;
  front: string;
  back: string;
  mastered: boolean;
  review_count: number;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useFlashcards(topicId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['flashcards', user?.id, topicId],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (topicId) {
        query = query.eq('topic_id', topicId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Flashcard[];
    },
    enabled: !!user,
  });
}

export function useCreateFlashcard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (flashcard: { front: string; back: string; topic_id?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('flashcards')
        .insert({ ...flashcard, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', user?.id] });
    },
  });
}

export function useUpdateFlashcard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Flashcard> & { id: string }) => {
      const { data, error } = await supabase
        .from('flashcards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', user?.id] });
    },
  });
}

export function useDeleteFlashcard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', user?.id] });
    },
  });
}

export function useBulkCreateFlashcards() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (flashcards: { front: string; back: string; topic_id?: string }[]) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('flashcards')
        .insert(flashcards.map(f => ({ ...f, user_id: user.id })))
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', user?.id] });
    },
  });
}
