import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useUpdateProfile } from './useProfile';

export interface StudyTask {
  id: string;
  user_id: string;
  topic_id: string | null;
  title: string;
  task_type: 'flashcard' | 'question' | 'test';
  scheduled_date: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export function useStudyTasks(date?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['study_tasks', user?.id, date],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('study_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: true });
      
      if (date) {
        query = query.eq('scheduled_date', date);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as StudyTask[];
    },
    enabled: !!user,
  });
}

export function useCreateStudyTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (task: { 
      title: string; 
      task_type: 'flashcard' | 'question' | 'test';
      scheduled_date: string;
      topic_id?: string 
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('study_tasks')
        .insert({ ...task, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study_tasks', user?.id] });
    },
  });
}

export function useUpdateStudyTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StudyTask> & { id: string }) => {
      const { data, error } = await supabase
        .from('study_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study_tasks', user?.id] });
    },
  });
}

export function useBulkCreateStudyTasks() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (tasks: { 
      title: string; 
      task_type: 'flashcard' | 'question' | 'test';
      scheduled_date: string;
      topic_id?: string 
    }[]) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('study_tasks')
        .insert(tasks.map(t => ({ ...t, user_id: user.id })))
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study_tasks', user?.id] });
    },
  });
}

export function useDeleteAllStudyTasks() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('study_tasks')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Clear target_date when plan is deleted
      await updateProfile.mutateAsync({ target_date: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study_tasks', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}
