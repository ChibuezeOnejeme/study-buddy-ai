import { CheckCircle2, Circle, BookMarked, HelpCircle, ClipboardList, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StudyTask } from '@/hooks/useStudyTasks';
import { Topic } from '@/hooks/useTopics';

interface DailyTaskCardProps {
  task: StudyTask & { time_minutes?: number; description?: string };
  topic?: Topic;
  onToggle: (taskId: string, completed: boolean) => void;
}

const taskTypeConfig = {
  flashcard: { icon: BookMarked, color: 'text-accent', label: 'Flashcards' },
  question: { icon: HelpCircle, color: 'text-info', label: 'Questions' },
  test: { icon: ClipboardList, color: 'text-warning', label: 'Test' },
};

export function DailyTaskCard({ task, topic, onToggle }: DailyTaskCardProps) {
  const config = taskTypeConfig[task.task_type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-xl transition-all",
        task.completed
          ? "bg-success/5 border border-success/20"
          : "bg-secondary/50 hover:bg-secondary border border-transparent"
      )}
    >
      <button
        onClick={() => onToggle(task.id, !task.completed)}
        className="shrink-0 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-full"
      >
        {task.completed ? (
          <CheckCircle2 className="w-6 h-6 text-success" />
        ) : (
          <Circle className="w-6 h-6 text-muted-foreground hover:text-accent transition-colors" />
        )}
      </button>
      
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", 
        task.completed ? "bg-success/10" : "bg-secondary"
      )}>
        <Icon className={cn("w-4 h-4", task.completed ? "text-success" : config.color)} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className={cn(
          "font-medium",
          task.completed && "line-through text-muted-foreground"
        )}>
          {task.title}
        </div>
        {task.description && (
          <div className="text-sm text-muted-foreground truncate">
            {task.description}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-3 shrink-0">
        {task.time_minutes && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            {task.time_minutes}m
          </div>
        )}
        {topic && (
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-lg max-w-[100px] truncate">
            {topic.name}
          </span>
        )}
      </div>
    </div>
  );
}
