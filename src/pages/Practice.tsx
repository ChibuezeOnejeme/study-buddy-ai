import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuestions, useUpdateQuestion } from '@/hooks/useQuestions';
import { useFlashcards, useUpdateFlashcard } from '@/hooks/useFlashcards';
import { useTopics } from '@/hooks/useTopics';
import { useGamification } from '@/hooks/useGamification';
import { useBadges } from '@/hooks/useBadges';
import { useFeatureUnlock } from '@/hooks/useFeatureUnlock';
import { LockedPage } from '@/components/ui/locked-feature';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Check, X, Loader2, HelpCircle, ArrowRight, BookMarked, 
  ChevronLeft, ChevronRight, RotateCcw, ClipboardList, Trophy 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { showXPGainToast, showAchievementToast } from '@/components/gamification/AchievementToast';

type PracticeTab = 'flashcards' | 'questions' | 'exam';

const Practice = () => {
  const [activeTab, setActiveTab] = useState<PracticeTab>('flashcards');
  const { milestones, isLoading: loadingMilestones } = useFeatureUnlock();

  // Check if feature is locked - after all hooks
  if (!loadingMilestones && !milestones?.first_upload_completed) {
    return (
      <DashboardLayout>
        <LockedPage 
          title="Practice Locked" 
          description="Upload your first study material to start practicing with flashcards and questions."
        />
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">Practice</h1>
          <p className="text-muted-foreground">
            Choose your practice mode and start learning
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PracticeTab)}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="flashcards" className="flex items-center gap-2">
              <BookMarked className="w-4 h-4" />
              <span className="hidden sm:inline">Flashcards</span>
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Questions</span>
            </TabsTrigger>
            <TabsTrigger value="exam" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Exam</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flashcards">
            <FlashcardsMode />
          </TabsContent>
          
          <TabsContent value="questions">
            <QuestionsMode />
          </TabsContent>
          
          <TabsContent value="exam">
            <ExamMode />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

// Flashcards Mode Component
function FlashcardsMode() {
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState(false);

  const { data: allFlashcards = [], isLoading } = useFlashcards();
  const { data: topics = [] } = useTopics();
  const updateFlashcard = useUpdateFlashcard();
  const { awardXP, recordActivity } = useGamification();
  const { checkBadges } = useBadges();
  const { unlockFeature } = useFeatureUnlock();

  const flashcards = useMemo(() => {
    if (selectedTopic === 'all') return allFlashcards;
    return allFlashcards.filter(f => f.topic_id === selectedTopic);
  }, [allFlashcards, selectedTopic]);

  const currentCard = flashcards[currentIndex];

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
    }
  };

  const handleMastered = async (mastered: boolean) => {
    if (!currentCard) return;
    
    const wasAlreadyMastered = currentCard.mastered;
    
    await updateFlashcard.mutateAsync({
      id: currentCard.id,
      mastered,
      review_count: currentCard.review_count + 1,
      last_reviewed_at: new Date().toISOString(),
    });
    
    // Mark milestone - first flashcard reviewed
    await unlockFeature('first_flashcard_reviewed');
    
    try {
      const reviewResult = await awardXP({ 
        eventType: 'flashcard_review',
        topicId: currentCard.topic_id 
      });
      showXPGainToast({ amount: reviewResult.xpAwarded, eventType: 'flashcard_review' });
      
      if (mastered && !wasAlreadyMastered) {
        const masterResult = await awardXP({ 
          eventType: 'flashcard_master',
          topicId: currentCard.topic_id 
        });
        showXPGainToast({ amount: masterResult.xpAwarded, eventType: 'flashcard_master' });
        
        const masteredCount = flashcards.filter(f => f.mastered).length + 1;
        const reviewedCount = flashcards.reduce((acc, f) => acc + (f.review_count || 0), 0) + 1;
        const newBadges = await checkBadges({ 
          flashcardsMastered: masteredCount,
          flashcardsReviewed: reviewedCount 
        });
        
        newBadges.forEach(badge => showAchievementToast(badge));
      }
      
      await recordActivity();
    } catch (error) {
      console.error('Error awarding XP:', error);
    }
    
    handleNext();
  };

  const handleStartStudy = () => {
    setStudyMode(true);
    setCurrentIndex(0);
    setFlipped(false);
  };

  const masteredCount = flashcards.filter(f => f.mastered).length;
  const progress = flashcards.length > 0 ? (masteredCount / flashcards.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-20 bg-card rounded-2xl border border-border">
        <BookMarked className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="font-display text-xl font-semibold mb-2">No flashcards yet</h3>
        <p className="text-muted-foreground mb-6">
          Upload study materials to generate flashcards automatically.
        </p>
        <Button variant="hero" asChild>
          <Link to="/dashboard">Upload Content</Link>
        </Button>
      </div>
    );
  }

  if (studyMode && currentCard) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Card {currentIndex + 1} of {flashcards.length}</span>
            <span className="text-accent font-medium">{Math.round(progress)}% mastered</span>
          </div>
          <div className="h-2 bg-secondary rounded-full">
            <div 
              className="h-full bg-gradient-accent rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Flashcard */}
        <div 
          className="perspective-1000 cursor-pointer mb-8"
          onClick={() => setFlipped(!flipped)}
        >
          <div className={cn(
            "relative h-80 transition-transform duration-500 transform-style-3d",
            flipped && "rotate-y-180"
          )}>
            {/* Front */}
            <div className={cn(
              "absolute inset-0 bg-gradient-hero rounded-2xl p-8 flex items-center justify-center backface-hidden",
              flipped && "invisible"
            )}>
              <p className="text-primary-foreground text-2xl font-medium text-center">
                {currentCard.front}
              </p>
            </div>
            
            {/* Back */}
            <div className={cn(
              "absolute inset-0 bg-card border border-border rounded-2xl p-8 flex items-center justify-center backface-hidden rotate-y-180",
              !flipped && "invisible"
            )}>
              <p className="text-foreground text-xl text-center">
                {currentCard.back}
              </p>
            </div>
          </div>
          <p className="text-center text-muted-foreground text-sm mt-4">
            Click to flip
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          {flipped && (
            <>
              <Button
                variant="destructive"
                size="lg"
                onClick={() => handleMastered(false)}
              >
                <X className="w-5 h-5 mr-2" />
                Need Review
              </Button>
              <Button
                variant="success"
                size="lg"
                onClick={() => handleMastered(true)}
              >
                <Check className="w-5 h-5 mr-2" />
                Mastered
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            size="lg"
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* End study mode */}
        <div className="text-center mt-8">
          <Button
            variant="ghost"
            onClick={() => setStudyMode(false)}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Back to Overview
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-muted-foreground">
            {flashcards.length} cards • {masteredCount} mastered
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedTopic} onValueChange={(v) => {
            setSelectedTopic(v);
            setCurrentIndex(0);
            setFlipped(false);
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {topics.map((topic) => (
                <SelectItem key={topic.id} value={topic.id}>{topic.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="hero" onClick={handleStartStudy}>
            Start Studying
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flashcards.map((card) => (
          <div
            key={card.id}
            className={cn(
              "bg-card rounded-xl border p-6 transition-all hover:shadow-md",
              card.mastered ? "border-success/50 bg-success/5" : "border-border"
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                card.mastered 
                  ? "bg-success/20 text-success" 
                  : "bg-secondary text-muted-foreground"
              )}>
                {card.mastered ? 'Mastered' : 'Learning'}
              </span>
              <span className="text-xs text-muted-foreground">
                Reviewed {card.review_count}x
              </span>
            </div>
            <p className="font-medium mb-2 line-clamp-2">{card.front}</p>
            <p className="text-muted-foreground text-sm line-clamp-2">{card.back}</p>
          </div>
        ))}
      </div>
    </>
  );
}

// Questions Mode Component
function QuestionsMode() {
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);

  const { data: allQuestions = [], isLoading } = useQuestions();
  const { data: topics = [] } = useTopics();
  const updateQuestion = useUpdateQuestion();
  const { awardXP, recordActivity } = useGamification();
  const { checkBadges } = useBadges();

  const questions = useMemo(() => {
    if (selectedTopic === 'all') return allQuestions;
    return allQuestions.filter(q => q.topic_id === selectedTopic);
  }, [allQuestions, selectedTopic]);

  const currentQuestion = questions[currentIndex];

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !selectedAnswer) return;

    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    setShowResult(true);

    await updateQuestion.mutateAsync({
      id: currentQuestion.id,
      answered_correctly: isCorrect,
      last_attempted_at: new Date().toISOString(),
    });

    if (isCorrect) {
      toast.success('Correct! 🎉');
      
      try {
        const result = await awardXP({ 
          eventType: 'question_correct',
          topicId: currentQuestion.topic_id 
        });
        showXPGainToast({ amount: result.xpAwarded, eventType: 'question_correct' });
        
        const correctCount = questions.filter(q => q.answered_correctly === true).length + 1;
        const newBadges = await checkBadges({ questionsCorrect: correctCount });
        newBadges.forEach(badge => showAchievementToast(badge));
        
        await recordActivity();
      } catch (error) {
        console.error('Error awarding XP:', error);
      }
    } else {
      toast.error('Not quite right. Check the explanation.');
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setPracticeMode(false);
      toast.success('Practice session complete!');
    }
  };

  const handleStartPractice = () => {
    setPracticeMode(true);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const correctCount = questions.filter(q => q.answered_correctly === true).length;
  const attemptedCount = questions.filter(q => q.answered_correctly !== null).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-20 bg-card rounded-2xl border border-border">
        <HelpCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="font-display text-xl font-semibold mb-2">No practice questions yet</h3>
        <p className="text-muted-foreground mb-6">
          Upload study materials to generate questions automatically.
        </p>
        <Button variant="hero" asChild>
          <Link to="/dashboard">Upload Content</Link>
        </Button>
      </div>
    );
  }

  if (practiceMode && currentQuestion) {
    return (
      <div className="max-w-3xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Question {currentIndex + 1} of {questions.length}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full">
            <div 
              className="h-full bg-gradient-accent rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-card rounded-2xl border border-border p-8 mb-6">
          <p className="text-xl font-medium mb-6">{currentQuestion.question}</p>

          {currentQuestion.options && (
            <div className="space-y-3">
              {(currentQuestion.options as string[]).map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQuestion.correct_answer;
                
                let buttonClass = "w-full text-left p-4 rounded-xl border-2 transition-all";
                
                if (showResult) {
                  if (isCorrect) {
                    buttonClass += " border-success bg-success/10";
                  } else if (isSelected && !isCorrect) {
                    buttonClass += " border-destructive bg-destructive/10";
                  } else {
                    buttonClass += " border-border";
                  }
                } else {
                  buttonClass += isSelected 
                    ? " border-accent bg-accent/10" 
                    : " border-border hover:border-accent/50";
                }

                return (
                  <button
                    key={index}
                    className={buttonClass}
                    onClick={() => !showResult && setSelectedAnswer(option)}
                    disabled={showResult}
                  >
                    <span className="flex items-center gap-3">
                      <span className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2",
                        showResult && isCorrect ? "border-success bg-success text-success-foreground" :
                        showResult && isSelected && !isCorrect ? "border-destructive bg-destructive text-destructive-foreground" :
                        isSelected ? "border-accent bg-accent text-accent-foreground" :
                        "border-border"
                      )}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {showResult && currentQuestion.explanation && (
            <div className="mt-6 p-4 bg-muted rounded-xl">
              <p className="text-sm font-medium mb-1">Explanation:</p>
              <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!showResult ? (
            <Button
              variant="hero"
              size="lg"
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
            >
              Check Answer
            </Button>
          ) : (
            <Button
              variant="hero"
              size="lg"
              onClick={handleNext}
            >
              {currentIndex < questions.length - 1 ? (
                <>Next Question <ArrowRight className="w-4 h-4 ml-2" /></>
              ) : (
                'Finish Practice'
              )}
            </Button>
          )}
        </div>

        <div className="text-center mt-6">
          <Button variant="ghost" onClick={() => setPracticeMode(false)}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Back to Overview
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-muted-foreground">
            {questions.length} questions • {correctCount}/{attemptedCount} correct
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedTopic} onValueChange={(v) => {
            setSelectedTopic(v);
            setCurrentIndex(0);
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {topics.map((topic) => (
                <SelectItem key={topic.id} value={topic.id}>{topic.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="hero" onClick={handleStartPractice}>
            Start Practice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {questions.map((q, index) => (
          <div
            key={q.id}
            className={cn(
              "bg-card rounded-xl border p-6 transition-all hover:shadow-md",
              q.answered_correctly === true && "border-success/50 bg-success/5",
              q.answered_correctly === false && "border-destructive/50 bg-destructive/5"
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                Q{index + 1}
              </span>
              {q.answered_correctly !== null && (
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full",
                  q.answered_correctly
                    ? "bg-success/20 text-success"
                    : "bg-destructive/20 text-destructive"
                )}>
                  {q.answered_correctly ? 'Correct' : 'Incorrect'}
                </span>
              )}
            </div>
            <p className="font-medium line-clamp-3">{q.question}</p>
          </div>
        ))}
      </div>
    </>
  );
}

// Exam Mode Component  
function ExamMode() {
  const [examStarted, setExamStarted] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState(10);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [examComplete, setExamComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [examQuestions, setExamQuestions] = useState<any[]>([]);

  const { data: allQuestions = [], isLoading } = useQuestions();
  const { data: topics = [] } = useTopics();
  const { awardXP, recordActivity } = useGamification();
  const { unlockFeature } = useFeatureUnlock();

  const currentQuestion = examQuestions[currentIndex];

  const handleSelectAnswer = (answer: string) => {
    setAnswers({ ...answers, [currentIndex]: answer });
  };

  const handleNext = () => {
    if (currentIndex < examQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmitExam = async () => {
    let correctAnswers = 0;
    examQuestions.forEach((q, i) => {
      if (answers[i] === q.correct_answer) {
        correctAnswers++;
      }
    });
    
    setScore(correctAnswers);
    setExamComplete(true);
    
    // Mark first test completed milestone
    await unlockFeature('first_test_completed');
    
    try {
      const result = await awardXP({ eventType: 'mock_test_complete' });
      showXPGainToast({ amount: result.xpAwarded, eventType: 'mock_test_complete' });
      
      const percentage = (correctAnswers / examQuestions.length) * 100;
      if (percentage >= 80) {
        const bonusResult = await awardXP({ eventType: 'score_80_plus_bonus' });
        showXPGainToast({ amount: bonusResult.xpAwarded, eventType: 'score_80_plus_bonus' });
      }
      if (percentage === 100) {
        const perfectResult = await awardXP({ eventType: 'score_100_bonus' });
        showXPGainToast({ amount: perfectResult.xpAwarded, eventType: 'score_100_bonus' });
      }
      
      await recordActivity();
    } catch (error) {
      console.error('Error awarding XP:', error);
    }
    
    toast.success('Exam complete!');
  };

  const handleStartExam = () => {
    // Filter and shuffle questions when starting the exam
    let qs = selectedTopic === 'all' ? allQuestions : allQuestions.filter(q => q.topic_id === selectedTopic);
    const shuffled = [...qs].sort(() => Math.random() - 0.5).slice(0, questionCount);
    setExamQuestions(shuffled);
    setExamStarted(true);
    setCurrentIndex(0);
    setAnswers({});
    setExamComplete(false);
    setScore(0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (allQuestions.length === 0) {
    return (
      <div className="text-center py-20 bg-card rounded-2xl border border-border">
        <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="font-display text-xl font-semibold mb-2">No questions for exam</h3>
        <p className="text-muted-foreground mb-6">
          Upload study materials to generate questions for your exam.
        </p>
        <Button variant="hero" asChild>
          <Link to="/dashboard">Upload Content</Link>
        </Button>
      </div>
    );
  }

  if (examComplete) {
    const percentage = (score / examQuestions.length) * 100;
    
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className={cn(
          "w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center",
          percentage >= 80 ? "bg-success/20" : percentage >= 50 ? "bg-warning/20" : "bg-destructive/20"
        )}>
          <Trophy className={cn(
            "w-12 h-12",
            percentage >= 80 ? "text-success" : percentage >= 50 ? "text-warning" : "text-destructive"
          )} />
        </div>
        
        <h2 className="font-display text-3xl font-bold mb-2">Exam Complete!</h2>
        <p className="text-4xl font-bold text-accent mb-2">{score}/{examQuestions.length}</p>
        <p className="text-muted-foreground mb-8">
          You scored {Math.round(percentage)}%
        </p>
        
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => setExamStarted(false)}>
            Back to Setup
          </Button>
          <Button variant="hero" onClick={handleStartExam}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-card rounded-2xl border border-border p-8">
          <h2 className="font-display text-xl font-semibold mb-6">Configure Your Exam</h2>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Topic</Label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>{topic.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Number of Questions: {questionCount}</Label>
              <Slider
                value={[questionCount]}
                onValueChange={([v]) => setQuestionCount(v)}
                min={5}
                max={Math.min(30, allQuestions.length)}
                step={5}
              />
            </div>
            
            <Button variant="hero" className="w-full" onClick={handleStartExam}>
              Start Exam
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">
            Question {currentIndex + 1} of {examQuestions.length}
          </span>
          <span className="text-muted-foreground">
            {answeredCount} answered
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full">
          <div 
            className="h-full bg-gradient-accent rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / examQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-card rounded-2xl border border-border p-8 mb-6">
        <p className="text-xl font-medium mb-6">{currentQuestion.question}</p>

        {currentQuestion.options && (
          <div className="space-y-3">
            {(currentQuestion.options as string[]).map((option, index) => {
              const isSelected = answers[currentIndex] === option;
              
              return (
                <button
                  key={index}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border-2 transition-all",
                    isSelected 
                      ? "border-accent bg-accent/10" 
                      : "border-border hover:border-accent/50"
                  )}
                  onClick={() => handleSelectAnswer(option)}
                >
                  <span className="flex items-center gap-3">
                    <span className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2",
                      isSelected ? "border-accent bg-accent text-accent-foreground" : "border-border"
                    )}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        {currentIndex === examQuestions.length - 1 ? (
          <Button
            variant="hero"
            onClick={handleSubmitExam}
            disabled={answeredCount < examQuestions.length}
          >
            Submit Exam
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={handleNext}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Question navigation dots */}
      <div className="flex flex-wrap justify-center gap-2 mt-6">
        {examQuestions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={cn(
              "w-8 h-8 rounded-full text-xs font-medium transition-all",
              i === currentIndex ? "bg-accent text-accent-foreground" :
              answers[i] ? "bg-success/20 text-success" : "bg-secondary text-muted-foreground"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Practice;
