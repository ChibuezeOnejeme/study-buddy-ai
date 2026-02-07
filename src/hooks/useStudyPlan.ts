import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { addDays, format, startOfDay } from 'date-fns';
import { Topic } from './useTopics';

interface StudyPlanSettings {
  targetDate: Date;
  studyTimes: string[]; // e.g., ['09:00', '18:00']
}

interface GeneratedTask {
  title: string;
  task_type: 'flashcard' | 'question' | 'test';
  scheduled_date: string;
  topic_id: string;
  time_minutes: number;
  description: string;
}

export function useGenerateStudyPlan() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ settings, topics }: { settings: StudyPlanSettings; topics: Topic[] }) => {
      if (!user) throw new Error('Not authenticated');

      const today = startOfDay(new Date());
      const targetDate = startOfDay(settings.targetDate);
      
      // Calculate all study days from today to target date
      const studyDates: Date[] = [];
      let currentDate = today;
      
      while (currentDate <= targetDate) {
        studyDates.push(new Date(currentDate));
        currentDate = addDays(currentDate, 1);
      }

      if (studyDates.length === 0) {
        throw new Error('No study days available before target date');
      }

      // Tasks per day based on number of time slots selected
      const tasksPerDay = settings.studyTimes.length;
      const timePerTask = 15; // Fixed 15 min per task
      
      const tasks: GeneratedTask[] = [];
      let topicIndex = 0;
      
      // Distribute topics across study days
      for (let dayIndex = 0; dayIndex < studyDates.length; dayIndex++) {
        const studyDate = format(studyDates[dayIndex], 'yyyy-MM-dd');
        
        // Add tasks for each time slot
        for (let slotIndex = 0; slotIndex < tasksPerDay; slotIndex++) {
          const topic = topics[topicIndex % topics.length];
          
          // Alternate between flashcards and questions
          const isFlashcard = (dayIndex + slotIndex) % 2 === 0;
          
          tasks.push({
            title: isFlashcard ? `Flashcards: ${topic.name}` : `Questions: ${topic.name}`,
            task_type: isFlashcard ? 'flashcard' : 'question',
            scheduled_date: studyDate,
            topic_id: topic.id,
            time_minutes: timePerTask,
            description: isFlashcard 
              ? 'Practice flashcards for this topic' 
              : 'Answer practice questions',
          });
          
          topicIndex++;
        }

        // Add review day every 4th day
        if ((dayIndex + 1) % 4 === 0 && dayIndex < studyDates.length - 1) {
          const nextDate = format(studyDates[dayIndex + 1], 'yyyy-MM-dd');
          tasks.push({
            title: '🔁 Review Day',
            task_type: 'flashcard',
            scheduled_date: nextDate,
            topic_id: topics[0]?.id || '',
            time_minutes: 30,
            description: 'Review weak flashcards from previous topics',
          });
        }

        // Add mini mock test every 7th day
        if ((dayIndex + 1) % 7 === 0) {
          tasks.push({
            title: '📝 Mini Mock Test',
            task_type: 'test',
            scheduled_date: studyDate,
            topic_id: topics[0]?.id || '',
            time_minutes: 30,
            description: 'Complete a timed practice test',
          });
        }
      }

      // Clear existing tasks and insert new ones
      await supabase
        .from('study_tasks')
        .delete()
        .eq('user_id', user.id);

      const { data, error } = await supabase
        .from('study_tasks')
        .insert(tasks.map(t => ({ ...t, user_id: user.id })))
        .select();

      if (error) throw error;

      // Update profile with study settings
      await supabase
        .from('profiles')
        .update({
          target_date: format(settings.targetDate, 'yyyy-MM-dd'),
        })
        .eq('user_id', user.id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study_tasks'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
