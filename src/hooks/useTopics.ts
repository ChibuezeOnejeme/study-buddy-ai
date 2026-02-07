import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface Topic {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  priority: 'high' | 'medium' | 'low';
  progress: number;
  created_at: string;
  updated_at: string;
}

export function useTopics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['topics', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Topic[];
    },
    enabled: !!user,
  });
}

export function useCreateTopic() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (topic: { name: string; description?: string; priority?: 'high' | 'medium' | 'low' }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('topics')
        .insert({ ...topic, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics', user?.id] });
    },
  });
}

export function useUpdateTopic() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Topic> & { id: string }) => {
      const { data, error } = await supabase
        .from('topics')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics', user?.id] });
    },
  });
}

export function useDeleteTopic() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics', user?.id] });
    },
  });
}
