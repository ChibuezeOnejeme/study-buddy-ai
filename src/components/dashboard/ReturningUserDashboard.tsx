import { useMemo } from 'react';
import { Link } from 'react-router-dom';
 import { useTranslation } from 'react-i18next';
import { useProfile } from '@/hooks/useProfile';
import { useTopics } from '@/hooks/useTopics';
import { useFlashcards } from '@/hooks/useFlashcards';
import { useQuestions } from '@/hooks/useQuestions';
import { useSubscription } from '@/hooks/useSubscription';
import { PlanBadge } from '@/components/subscription/PlanBadge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BookMarked, 
  HelpCircle, 
  Target, 
  ArrowRight,
  Upload,
  Sparkles,
  Layers,
  Clock
} from 'lucide-react';
import { differenceInDays } from 'date-fns';

export function ReturningUserDashboard() {
   const { t } = useTranslation();
  const { data: profile } = useProfile();
  const { data: topics = [] } = useTopics();
  const { data: flashcards = [] } = useFlashcards();
  const { data: questions = [] } = useQuestions();
  
  const { effectivePlan, isDevMode } = useSubscription();

  const stats = useMemo(() => {
    const masteredFlashcards = flashcards.filter(f => f.mastered).length;
    const correctAnswers = questions.filter(q => q.answered_correctly === true).length;
    
    const flashcardProgress = flashcards.length > 0 ? (masteredFlashcards / flashcards.length) * 100 : 0;
    const questionProgress = questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0;
    const avgProgress = topics.length > 0 
      ? topics.reduce((acc, t) => acc + t.progress, 0) / topics.length 
      : 0;
    
    const readiness = Math.round((flashcardProgress + questionProgress + avgProgress) / 3);

    return {
      totalFlashcards: flashcards.length,
      masteredFlashcards,
      totalQuestions: questions.length,
      correctAnswers,
      readiness,
      topicCount: topics.length,
    };
  }, [flashcards, questions, topics]);

  const daysUntilTarget = profile?.target_date 
    ? differenceInDays(new Date(profile.target_date), new Date())
    : null;

  // Determine next suggested action
  const getNextAction = () => {
    if (flashcards.length === 0) {
       return { label: t('dashboard.uploadMaterial'), path: '/upload', icon: Upload };
    }
    const unreviewedCards = flashcards.filter(f => !f.mastered);
    if (unreviewedCards.length > 0) {
       return { label: t('dashboard.flashcards'), path: '/practice', icon: BookMarked };
    }
    const unansweredQuestions = questions.filter(q => q.answered_correctly === null);
    if (unansweredQuestions.length > 0) {
       return { label: t('dashboard.questions'), path: '/practice', icon: HelpCircle };
    }
     return { label: t('practice.examMode'), path: '/practice', icon: Target };
  };

  const nextAction = getNextAction();

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">
             {t('dashboard.welcomeBack')}{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-muted-foreground">
             {profile?.study_goal === 'interview' ? t('dashboard.interviewPrep') : t('dashboard.examPrep')}
            {daysUntilTarget !== null && daysUntilTarget > 0 && (
               <span className="text-accent font-medium"> • {daysUntilTarget} {t('dashboard.daysRemaining')}</span>
            )}
          </p>
        </div>
        <PlanBadge plan={effectivePlan} isDevMode={isDevMode} />
      </div>

      {/* Primary: Continue Studying CTA */}
      <div className="bg-gradient-hero rounded-2xl p-8 text-primary-foreground mb-6">
        <div className="flex items-center justify-between">
          <div>
             <p className="text-primary-foreground/80 mb-2">{t('dashboard.continueStudy')}</p>
            <h2 className="font-display text-2xl font-bold mb-4">{nextAction.label}</h2>
            <Button 
              variant="secondary" 
              size="lg" 
              className="bg-white/20 hover:bg-white/30 text-white border-0"
              asChild
            >
              <Link to={nextAction.path}>
                <Sparkles className="w-5 h-5 mr-2" />
                 {t('dashboard.startNow')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
          <div className="hidden md:flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-white/30 flex items-center justify-center">
              <span className="font-display text-4xl font-bold">{stats.readiness}%</span>
            </div>
             <span className="text-sm text-primary-foreground/70 mt-2">{t('dashboard.readiness')}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid - Simplified */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={BookMarked}
           label={t('dashboard.flashcards')}
          value={stats.totalFlashcards}
           subValue={`${stats.masteredFlashcards} ${t('dashboard.mastered')}`}
        />
        <StatCard
          icon={HelpCircle}
           label={t('dashboard.questions')}
          value={stats.totalQuestions}
           subValue={`${stats.correctAnswers} ${t('dashboard.correct')}`}
        />
        <StatCard
          icon={Layers}
           label={t('dashboard.topics')}
          value={stats.topicCount}
           subValue={t('dashboard.organized')}
        />
        <StatCard
          icon={Clock}
           label={t('dashboard.retention')}
          value="60"
           subValue={t('dashboard.daysStorage')}
        />
      </div>

      {/* Topics Progress */}
      {topics.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
             <h2 className="font-display text-lg font-semibold">{t('dashboard.yourTopics')}</h2>
            <Button variant="ghost" size="sm" asChild>
               <Link to="/topics">{t('dashboard.viewAll')}</Link>
            </Button>
          </div>
          <ul className="space-y-3">
            {topics.slice(0, 5).map((topic) => (
              <li key={topic.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{topic.name}</span>
                  <span className="text-xs text-muted-foreground">{topic.progress}%</span>
                </div>
                <Progress value={topic.progress} className="h-2" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link to="/upload">
            <Upload className="w-4 h-4 mr-2" />
             {t('dashboard.uploadMaterial')}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/practice">
            <BookMarked className="w-4 h-4 mr-2" />
             {t('dashboard.practice')}
          </Link>
        </Button>
      </div>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  subValue: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-accent" />
      </div>
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="text-muted-foreground text-xs">{subValue}</p>
    </div>
  );
}
