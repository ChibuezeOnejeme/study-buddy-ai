import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar as CalendarIcon, Loader2, Sparkles, BookOpen, Clock } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useGenerateStudyPlan } from '@/hooks/useStudyPlan';
import { useTopics } from '@/hooks/useTopics';
import { toast } from 'sonner';

interface CreateStudyPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIME_SLOTS = [
  { value: '06:00', label: '6:00 AM' },
  { value: '07:00', label: '7:00 AM' },
  { value: '08:00', label: '8:00 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '21:00', label: '9:00 PM' },
  { value: '22:00', label: '10:00 PM' },
];

export function CreateStudyPlanModal({ open, onOpenChange }: CreateStudyPlanModalProps) {
  const [targetDate, setTargetDate] = useState<Date>(addDays(new Date(), 30));
  const [selectedTimes, setSelectedTimes] = useState<string[]>(['09:00', '18:00']);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  
  const { data: topics = [] } = useTopics();
  const generatePlan = useGenerateStudyPlan();

  const toggleTime = (time: string) => {
    setSelectedTimes(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time)
        : [...prev, time].sort()
    );
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopicIds(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const selectAllTopics = () => {
    setSelectedTopicIds(topics.map(t => t.id));
  };

  const deselectAllTopics = () => {
    setSelectedTopicIds([]);
  };

  const selectedTopics = topics.filter(t => selectedTopicIds.includes(t.id));

  const handleGenerate = async () => {
    if (selectedTopics.length === 0) {
      toast.error('Select at least one topic for your study plan');
      return;
    }

    if (selectedTimes.length === 0) {
      toast.error('Select at least one study time');
      return;
    }

    try {
      await generatePlan.mutateAsync({
        settings: {
          targetDate,
          studyTimes: selectedTimes,
        },
        topics: selectedTopics,
      });
      toast.success('Study plan created! Check your daily schedule.');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to generate plan:', error);
      toast.error('Failed to create study plan');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Create Study Plan
          </DialogTitle>
          <DialogDescription>
            Select topics, set your target date, and preferred study times.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Topic Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Select Topics
                </Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAllTopics}>
                    All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAllTopics}>
                    None
                  </Button>
                </div>
              </div>
              
              {topics.length === 0 ? (
                <div className="text-sm text-muted-foreground bg-secondary/50 rounded-lg p-4 text-center">
                  No topics yet. Upload content first to create topics.
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {topics.map(topic => (
                    <label
                      key={topic.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedTopicIds.includes(topic.id)}
                        onCheckedChange={() => toggleTopic(topic.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{topic.name}</div>
                        {topic.description && (
                          <div className="text-xs text-muted-foreground truncate">{topic.description}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {selectedTopicIds.length} of {topics.length} topics selected
              </div>
            </div>

            {/* Target Date */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Target Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !targetDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {targetDate ? format(targetDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={targetDate}
                    onSelect={(date) => date && setTargetDate(date)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Study Times */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Preferred Study Times
              </Label>
              <div className="flex gap-2 flex-wrap">
                {TIME_SLOTS.map(slot => (
                  <button
                    key={slot.value}
                    onClick={() => toggleTime(slot.value)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      selectedTimes.includes(slot.value)
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    )}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedTimes.length} time slot{selectedTimes.length !== 1 ? 's' : ''} selected
              </div>
            </div>

            {/* Summary */}
            <div className="bg-secondary/50 rounded-xl p-4">
              <h4 className="font-medium mb-2">Your Plan Summary</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>📅 Target: {format(targetDate, 'MMM d, yyyy')}</li>
                <li>📚 {selectedTopicIds.length} topic{selectedTopicIds.length !== 1 ? 's' : ''} selected</li>
                <li>⏰ {selectedTimes.length} study time{selectedTimes.length !== 1 ? 's' : ''}/day</li>
              </ul>
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="hero" 
            className="flex-1" 
            onClick={handleGenerate}
            disabled={generatePlan.isPending || selectedTopicIds.length === 0 || selectedTimes.length === 0}
          >
            {generatePlan.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Save Plan
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
