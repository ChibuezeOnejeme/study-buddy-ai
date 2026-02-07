import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTopics, useCreateTopic, useUpdateTopic, useDeleteTopic, Topic } from '@/hooks/useTopics';
import { useTopicMastery } from '@/hooks/useTopicMastery';
import { useFeatureUnlock } from '@/hooks/useFeatureUnlock';
import { useContentUploads } from '@/hooks/useContentUploads';
import { useRegenerateContent } from '@/hooks/useRegenerateContent';
import { TopicXPBadge } from '@/components/gamification/TopicXPBadge';
import { TopicMasteryIndicator } from '@/components/gamification/TopicMasteryIndicator';
import { TopicSummaryCard } from '@/components/study/TopicSummaryCard';
import { LockedPage } from '@/components/ui/locked-feature';
import { Plus, Trash2, Edit2, Loader2, BookOpen, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { calculateLevel } from '@/lib/planLimits';

const Topics = () => {
   const { t } = useTranslation();
  // All hooks must be called unconditionally at the top
  const { milestones, isLoading: loadingMilestones } = useFeatureUnlock();
  const { data: topics = [], isLoading } = useTopics();
  const { data: uploads = [] } = useContentUploads();
  const { xpByTopic, allMastery } = useTopicMastery();
  const createTopic = useCreateTopic();
  const updateTopic = useUpdateTopic();
  const deleteTopic = useDeleteTopic();
  const regenerateContent = useRegenerateContent();
  const [regeneratingTopicId, setRegeneratingTopicId] = useState<string | null>(null);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [viewMode, setViewMode] = useState<'grid' | 'summaries'>('summaries');
  
  // Build mastery lookup
  const masteryByTopic = allMastery.reduce((acc, m) => {
    acc[m.topic_id] = m;
    return acc;
  }, {} as Record<string, typeof allMastery[0]>);

  // Build uploads by topic lookup
  const uploadsByTopic = uploads.reduce((acc, upload) => {
    if (upload.topic_id) {
      if (!acc[upload.topic_id]) acc[upload.topic_id] = [];
      acc[upload.topic_id].push(upload);
    }
    return acc;
  }, {} as Record<string, typeof uploads>);

  // Check if feature is locked - after all hooks
  if (!loadingMilestones && !milestones?.first_upload_completed) {
    return (
      <DashboardLayout>
        <LockedPage 
           title={t('topics.locked')} 
           description={t('topics.lockedDesc')}
        />
      </DashboardLayout>
    );
  }

  const handleOpenDialog = (topic?: Topic) => {
    if (topic) {
      setEditingTopic(topic);
      setName(topic.name);
      setDescription(topic.description || '');
      setPriority(topic.priority);
    } else {
      setEditingTopic(null);
      setName('');
      setDescription('');
      setPriority('medium');
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Topic name is required');
      return;
    }

    try {
      if (editingTopic) {
        await updateTopic.mutateAsync({
          id: editingTopic.id,
          name: name.trim(),
          description: description.trim() || null,
          priority,
        });
        toast.success('Topic updated');
      } else {
        await createTopic.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          priority,
        });
        toast.success('Topic created');
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save topic');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will delete all flashcards and questions in this topic.')) {
      return;
    }
    
    try {
      await deleteTopic.mutateAsync(id);
      toast.success('Topic deleted');
    } catch (error) {
      toast.error('Failed to delete topic');
    }
  };

  const handleRegenerate = async (topicId: string, topicName: string) => {
    if (!confirm('This will delete all existing flashcards and questions for this topic and generate new ones. Continue?')) {
      return;
    }
    
    setRegeneratingTopicId(topicId);
    try {
      await regenerateContent.mutateAsync({ topicId, topicName });
    } finally {
      setRegeneratingTopicId(null);
    }
  };

  const priorityColors = {
    high: 'bg-priority-high',
    medium: 'bg-priority-medium',
    low: 'bg-priority-low',
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
             <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">{t('topics.title')}</h1>
            <p className="text-muted-foreground">
               {t('topics.description')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-secondary rounded-lg p-1">
              <button
                onClick={() => setViewMode('summaries')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewMode === 'summaries' 
                    ? "bg-background shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BookOpen className="w-4 h-4 inline-block mr-1" />
                 {t('topics.summaries')}
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewMode === 'grid' 
                    ? "bg-background shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                 {t('topics.gridView')}
              </button>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" size="sm" onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4" />
                   {t('topics.addTopic')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                     {editingTopic ? t('topics.editTopic') : t('topics.createTopic')}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                     <Label>{t('topics.name')}</Label>
                    <Input
                      placeholder="e.g., Data Structures"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                     <Label>{t('topics.descriptionOptional')}</Label>
                    <Textarea
                      placeholder="Brief description..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                     <Label>{t('topics.priority')}</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="high">{t('topics.highPriority')}</SelectItem>
                         <SelectItem value="medium">{t('topics.mediumPriority')}</SelectItem>
                         <SelectItem value="low">{t('topics.lowPriority')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="hero" 
                    className="w-full" 
                    onClick={handleSave}
                    disabled={createTopic.isPending || updateTopic.isPending}
                  >
                    {(createTopic.isPending || updateTopic.isPending) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                       editingTopic ? t('topics.updateTopic') : t('topics.createTopic')
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
             <p className="text-muted-foreground mb-4">{t('topics.noTopics')}</p>
            <Button variant="outline" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
               {t('topics.createTopic')}
            </Button>
          </div>
        ) : viewMode === 'summaries' ? (
          /* Summaries View - Show expandable summary cards */
          <div className="space-y-4">
            {topics.length > 0 && uploads.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-accent" />
                </div>
                 <h3 className="font-display text-xl font-semibold mb-2">{t('topics.noSummaries')}</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                   {t('topics.noSummariesDesc')}
                </p>
              </div>
            ) : topics.map((topic) => {
              const topicUploads = uploadsByTopic[topic.id] || [];
              const latestUpload = topicUploads[0];
              
              // Only show card if there's a summary
              if (!latestUpload?.summary) {
                return (
                  <div key={topic.id} className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{topic.name}</h3>
                         <p className="text-sm text-muted-foreground">{t('topics.noSummaryAvailable')}</p>
                      </div>
                    </div>
                  </div>
                );
              }
              
              return (
                <TopicSummaryCard
                  key={topic.id}
                  topicId={topic.id}
                  topicName={topic.name}
                  summary={latestUpload?.summary || null}
                  createdAt={latestUpload?.created_at || topic.created_at}
                  flashcardCount={latestUpload?.flashcard_count || 20}
                  questionCount={latestUpload?.question_count || 30}
                  onRegenerate={handleRegenerate}
                  isRegenerating={regeneratingTopicId === topic.id}
                />
              );
            })}
          </div>
        ) : (
          /* Grid View - Original card layout */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => {
              const topicXP = xpByTopic[topic.id] || masteryByTopic[topic.id]?.xp_earned || 0;
              const topicLevel = calculateLevel(topicXP);
              const masteryLevel = masteryByTopic[topic.id]?.mastery_level || 'novice';
              
              return (
                <div
                  key={topic.id}
                  className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        priorityColors[topic.priority]
                      )} />
                      <span className="text-xs text-muted-foreground capitalize">
                         {t(`topics.${topic.priority}Priority`)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(topic)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(topic.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  
                  <h3 className="font-display text-xl font-semibold mb-2">{topic.name}</h3>
                  {topic.description && (
                    <p className="text-muted-foreground text-sm mb-4">{topic.description}</p>
                  )}
                  
                  {/* Topic XP and Mastery Display */}
                  <div className="flex items-center gap-2 mb-4">
                    <TopicMasteryIndicator level={masteryLevel} size="sm" />
                    {topicXP > 0 && (
                      <TopicXPBadge xp={topicXP} level={topicLevel} compact />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                       <span className="text-muted-foreground">{t('topics.progress')}</span>
                      <span className="font-medium">{topic.progress}%</span>
                    </div>
                    <Progress value={topic.progress} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Topics;
