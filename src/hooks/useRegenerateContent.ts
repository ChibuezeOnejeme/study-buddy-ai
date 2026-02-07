import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface RegenerateOptions {
  topicId: string;
  topicName: string;
}

export function useRegenerateContent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ topicId, topicName }: RegenerateOptions) => {
      if (!user) throw new Error('Not authenticated');

      // Step 1: Get the latest content upload for this topic to get the extracted text
      const { data: uploads, error: uploadError } = await supabase
        .from('content_uploads')
        .select('*')
        .eq('user_id', user.id)
        .eq('topic_id', topicId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (uploadError) throw uploadError;

      if (!uploads || uploads.length === 0) {
        throw new Error('No content found for this topic. Please upload content first.');
      }

      const latestUpload = uploads[0];
      const extractedText = latestUpload.extracted_text;

      if (!extractedText) {
        throw new Error('No extracted text found. Please re-upload your content.');
      }

      // Step 2: Delete existing flashcards for this topic
      const { error: deleteFlashcardsError } = await supabase
        .from('flashcards')
        .delete()
        .eq('user_id', user.id)
        .eq('topic_id', topicId);

      if (deleteFlashcardsError) {
        console.error('Error deleting flashcards:', deleteFlashcardsError);
        throw new Error('Failed to clear old flashcards');
      }

      // Step 3: Delete existing questions for this topic
      const { error: deleteQuestionsError } = await supabase
        .from('questions')
        .delete()
        .eq('user_id', user.id)
        .eq('topic_id', topicId);

      if (deleteQuestionsError) {
        console.error('Error deleting questions:', deleteQuestionsError);
        throw new Error('Failed to clear old questions');
      }

      // Step 4: Call generate-content edge function with existing extracted text
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          content: extractedText,
          topicId,
        },
      });

      if (error) {
        console.error('Generate content error:', error);
        throw new Error(error.message || 'Failed to regenerate content');
      }

      if (!data) {
        throw new Error('No data returned from content generation');
      }

      // Step 5: Save new flashcards
      if (data.flashcards?.length > 0) {
        const { error: flashcardsError } = await supabase
          .from('flashcards')
          .insert(
            data.flashcards.map((f: { front: string; back: string }) => ({
              front: f.front,
              back: f.back,
              topic_id: topicId,
              user_id: user.id,
            }))
          );

        if (flashcardsError) {
          console.error('Error saving flashcards:', flashcardsError);
          throw new Error('Failed to save new flashcards');
        }
      }

      // Step 6: Save new questions
      if (data.questions?.length > 0) {
        const { error: questionsError } = await supabase
          .from('questions')
          .insert(
            data.questions.map((q: { 
              question: string; 
              options: string[]; 
              correct_answer: string; 
              explanation: string 
            }) => ({
              question: q.question,
              options: q.options,
              correct_answer: q.correct_answer,
              explanation: q.explanation,
              topic_id: topicId,
              user_id: user.id,
            }))
          );

        if (questionsError) {
          console.error('Error saving questions:', questionsError);
          throw new Error('Failed to save new questions');
        }
      }

      // Step 7: Update content_uploads with new summary if provided
      if (data.summary) {
        await supabase
          .from('content_uploads')
          .update({
            summary: data.summary,
            flashcard_count: data.flashcards?.length || 0,
            question_count: data.questions?.length || 0,
          })
          .eq('id', latestUpload.id);
      }

      // Step 8: Update topic's last_regenerated_at timestamp
      await supabase
        .from('topics')
        .update({ last_regenerated_at: new Date().toISOString() })
        .eq('id', topicId);

      return {
        flashcardsCount: data.flashcards?.length || 0,
        questionsCount: data.questions?.length || 0,
      };
    },
    onSuccess: (result) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['content-uploads'] });
      
      toast.success(`Regenerated ${result.flashcardsCount} flashcards and ${result.questionsCount} questions!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to regenerate content');
    },
  });
}
