import { useMemo, useState } from 'react';
 import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useStudyTasks, useUpdateStudyTask, useDeleteAllStudyTasks } from '@/hooks/useStudyTasks';
import { useProfile } from '@/hooks/useProfile';
import { useTopics } from '@/hooks/useTopics';
import { useFeatureUnlock } from '@/hooks/useFeatureUnlock';
import { LockedPage } from '@/components/ui/locked-feature';
import { DailyTaskCard } from '@/components/study/DailyTaskCard';
import { CreateStudyPlanModal } from '@/components/study/CreateStudyPlanModal';
import { Calendar, Sparkles, Loader2, Target, Clock, CheckCircle2, Trash2 } from 'lucide-react';
import { format, differenceInDays, startOfDay, isToday, isPast, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const StudyPlanner = () => {
   const { t } = useTranslation();
  const { milestones, isLoading: loadingMilestones } = useFeatureUnlock();
  const { data: profile } = useProfile();
  const { data: allTasks = [], isLoading } = useStudyTasks();
  const { data: topics = [] } = useTopics();
  const updateTask = useUpdateStudyTask();
  const deleteAllTasks = useDeleteAllStudyTasks();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const today = startOfDay(new Date());
  const targetDate = profile?.target_date ? new Date(profile.target_date) : null;
  const daysRemaining = targetDate ? differenceInDays(targetDate, today) : null;

  // Group tasks by date - ONLY include dates that have tasks
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, typeof allTasks> = {};
    
    // Only add dates that have tasks
    allTasks.forEach(task => {
      if (!grouped[task.scheduled_date]) {
        grouped[task.scheduled_date] = [];
      }
      grouped[task.scheduled_date].push(task);
    });
    
    // Sort dates chronologically
    const sortedEntries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
    return Object.fromEntries(sortedEntries);
  }, [allTasks]);

  // Calculate progress stats
  const stats = useMemo(() => {
    const todayStr = format(today, 'yyyy-MM-dd');
    const todayTasks = allTasks.filter(t => t.scheduled_date === todayStr);
    const todayCompleted = todayTasks.filter(t => t.completed).length;
    const totalCompleted = allTasks.filter(t => t.completed).length;
    const totalMinutesToday = todayTasks.reduce((sum, t) => sum + ((t as any).time_minutes || 15), 0);
    const completedMinutesToday = todayTasks
      .filter(t => t.completed)
      .reduce((sum, t) => sum + ((t as any).time_minutes || 15), 0);
    
    return {
      todayTasks: todayTasks.length,
      todayCompleted,
      todayProgress: todayTasks.length > 0 ? Math.round((todayCompleted / todayTasks.length) * 100) : 0,
      totalCompleted,
      totalTasks: allTasks.length,
      totalMinutesToday,
      completedMinutesToday,
    };
  }, [allTasks, today]);

  const topicsMap = useMemo(() => {
    return topics.reduce((acc, t) => {
      acc[t.id] = t;
      return acc;
    }, {} as Record<string, typeof topics[0]>);
  }, [topics]);

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    await updateTask.mutateAsync({
      id: taskId,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    });
  };

  // Check if feature is locked
  if (!loadingMilestones && !milestones?.first_upload_completed) {
    return (
      <DashboardLayout>
        <LockedPage 
           title={t('planner.locked')} 
           description={t('planner.lockedDesc')}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
             <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">{t('planner.title')}</h1>
            <p className="text-muted-foreground">
               {t('planner.description')}
            </p>
          </div>
        <div className="flex items-center gap-3">
            {targetDate && (
              <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-xl">
                <Target className="w-4 h-4 text-accent" />
                <span className="font-medium text-sm">{format(targetDate, 'MMM d, yyyy')}</span>
              </div>
            )}
            {allTasks.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4" />
                     {t('planner.deletePlan')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Study Plan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all scheduled tasks from your study plan. You can create a new plan afterward.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                     <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          await deleteAllTasks.mutateAsync();
                          toast.success('Study plan deleted');
                        } catch (error) {
                          toast.error('Failed to delete plan');
                        }
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                       {t('common.delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button variant="hero" size="sm" onClick={() => setShowCreateModal(true)}>
              <Sparkles className="w-4 h-4" />
               {allTasks.length > 0 ? t('planner.createPlan') : t('planner.createPlan')}
            </Button>
          </div>
        </div>

        {/* Today's Progress Card */}
        {stats.todayTasks > 0 && (
          <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl border border-accent/20 p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                 <h2 className="font-display text-xl font-bold mb-1">📅 {t('planner.todaysProgress')} — {format(today, 'MMM d, yyyy')}</h2>
                <p className="text-muted-foreground">
                   {stats.todayCompleted}/{stats.todayTasks} {t('planner.tasksCompleted')} • {stats.completedMinutesToday}/{stats.totalMinutesToday} mins
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-3xl font-bold text-accent">{stats.todayProgress}%</div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
              </div>
            </div>
            <Progress value={stats.todayProgress} className="h-3 mt-4" />
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : allTasks.length === 0 ? (
          /* Empty state - No plan created */
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Calendar className="w-10 h-10 text-accent" />
            </div>
            <h3 className="font-display text-2xl font-bold mb-3">Create Your Study Plan</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Set your target date, daily study time, and we'll generate a personalized schedule that adapts to your progress.
            </p>
            <Button variant="hero" size="lg" onClick={() => setShowCreateModal(true)}>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Study Plan
            </Button>
          </div>
        ) : (
          /* Task cards - only dates with tasks */
          <div className="space-y-6">
            {Object.entries(tasksByDate).map(([date, tasks]) => {
              const dateObj = new Date(date + 'T00:00:00'); // Ensure proper date parsing
              const isTodayDate = isToday(dateObj);
              const isPastDate = isPast(dateObj) && !isTodayDate;
              const completedCount = tasks.filter(t => t.completed).length;
              const totalMinutes = tasks.reduce((sum, t) => sum + ((t as any).time_minutes || 15), 0);
              
              return (
                <div 
                  key={date}
                  className={cn(
                    "bg-card rounded-2xl border p-6",
                    isTodayDate ? "border-accent shadow-lg shadow-accent/5" : "border-border",
                    isPastDate && completedCount < tasks.length && "border-warning/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex flex-col items-center justify-center",
                        isTodayDate ? "bg-accent text-accent-foreground" : "bg-secondary"
                      )}>
                        <span className="text-xs uppercase font-medium">{format(dateObj, 'EEE')}</span>
                        <span className="text-xl font-bold">{format(dateObj, 'd')}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {isTodayDate ? 'Today' : format(dateObj, 'EEEE, MMM d')}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {completedCount}/{tasks.length} done
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {totalMinutes} min
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {tasks.length > 0 && (
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <DailyTaskCard
                          key={task.id}
                          task={task}
                          topic={task.topic_id ? topicsMap[task.topic_id] : undefined}
                          onToggle={handleToggleTask}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Create Study Plan Modal */}
        <CreateStudyPlanModal 
          open={showCreateModal} 
          onOpenChange={setShowCreateModal} 
        />
      </div>
    </DashboardLayout>
  );
};

export default StudyPlanner;
