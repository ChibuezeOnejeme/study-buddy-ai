import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ChevronDown, ChevronUp, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TopicSummaryCardProps {
  topicId: string;
  topicName: string;
  summary: string | null;
  createdAt: string;
  flashcardCount?: number;
  questionCount?: number;
  onRegenerate?: (topicId: string, topicName: string) => void;
  isRegenerating?: boolean;
}

export function TopicSummaryCard({ 
  topicId,
  topicName, 
  summary, 
  createdAt,
  flashcardCount = 0,
  questionCount = 0,
  onRegenerate,
  isRegenerating = false
}: TopicSummaryCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (!summary) {
    return null;
  }

  // Calculate days remaining (60 day retention)
  const uploadDate = new Date(createdAt);
  const expiryDate = new Date(uploadDate);
  expiryDate.setDate(expiryDate.getDate() + 60);
  const daysRemaining = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">{topicName}</CardTitle>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span>{flashcardCount} flashcards</span>
                <span>•</span>
                <span>{questionCount} questions</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRegenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRegenerate(topicId, topicName)}
                disabled={isRegenerating}
                className="shrink-0"
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Regenerate
                  </>
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="shrink-0"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Read Summary
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={cn(
        "transition-all duration-300 overflow-hidden",
        expanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 py-0"
      )}>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="bg-secondary/50 rounded-xl p-4 whitespace-pre-wrap text-sm leading-relaxed">
            {summary}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
          Uploaded on {format(new Date(createdAt), 'MMM d, yyyy')} • Content stored for 60 days
        </div>
      </CardContent>
    </Card>
  );
}
