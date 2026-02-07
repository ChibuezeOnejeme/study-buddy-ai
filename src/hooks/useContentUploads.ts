import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface ContentUpload {
  id: string;
  user_id: string;
  topic_id: string | null;
  file_name: string | null;
  file_type: string | null;
  extracted_text: string | null;
  summary: string | null;
  flashcard_count: number | null;
  question_count: number | null;
  processed: boolean | null;
  created_at: string;
}

export function useContentUploads(topicId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['content_uploads', user?.id, topicId],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('content_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (topicId) {
        query = query.eq('topic_id', topicId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ContentUpload[];
    },
    enabled: !!user,
  });
}

export function useContentUpload(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['content_upload', id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('content_uploads')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as ContentUpload;
    },
    enabled: !!user && !!id,
  });
}
