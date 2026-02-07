import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BookOpen, Briefcase, GraduationCap, CalendarIcon, ArrowRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useUpdateProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

type StudyGoal = 'interview' | 'exam';

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<StudyGoal | null>(null);
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();

  const handleComplete = async () => {
    if (!goal || !targetDate) {
      toast.error('Please select a goal and target date');
      return;
    }

    try {
      await updateProfile.mutateAsync({
        study_goal: goal,
        target_date: format(targetDate, 'yyyy-MM-dd'),
        onboarding_completed: true,
      });
      toast.success('Great! Your study journey begins now.');
      navigate('/upload?welcome=true');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-secondary/30">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-12 justify-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-accent-foreground" />
          </div>
          <span className="font-display text-2xl font-bold">Learnorita</span>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className={cn(
            "w-3 h-3 rounded-full transition-colors",
            step >= 1 ? "bg-accent" : "bg-border"
          )} />
          <div className="w-12 h-0.5 bg-border">
            <div className={cn(
              "h-full bg-accent transition-all",
              step >= 2 ? "w-full" : "w-0"
            )} />
          </div>
          <div className={cn(
            "w-3 h-3 rounded-full transition-colors",
            step >= 2 ? "bg-accent" : "bg-border"
          )} />
        </div>

        {/* Step 1: Select Goal */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h1 className="font-display text-4xl font-bold text-center mb-4">
              What are you preparing for?
            </h1>
            <p className="text-muted-foreground text-center text-lg mb-12">
              We'll customize your experience based on your goal
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <button
                onClick={() => setGoal('interview')}
                className={cn(
                  "group p-8 rounded-2xl border-2 transition-all duration-300 text-left",
                  goal === 'interview'
                    ? "border-accent bg-accent/5 shadow-glow"
                    : "border-border hover:border-accent/50"
                )}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-8 h-8 text-accent-foreground" />
                </div>
                <h3 className="font-display text-2xl font-semibold mb-2">Interview</h3>
                <p className="text-muted-foreground">
                  Prepare for job interviews with practice questions and key concepts
                </p>
              </button>

              <button
                onClick={() => setGoal('exam')}
                className={cn(
                  "group p-8 rounded-2xl border-2 transition-all duration-300 text-left",
                  goal === 'exam'
                    ? "border-accent bg-accent/5 shadow-glow"
                    : "border-border hover:border-accent/50"
                )}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-8 h-8 text-accent-foreground" />
                </div>
                <h3 className="font-display text-2xl font-semibold mb-2">Exam</h3>
                <p className="text-muted-foreground">
                  Study for academic exams with flashcards and comprehensive tests
                </p>
              </button>
            </div>

            <div className="flex justify-center">
              <Button
                variant="hero"
                size="xl"
                disabled={!goal}
                onClick={() => setStep(2)}
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Set Target Date */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h1 className="font-display text-4xl font-bold text-center mb-4">
              When is your {goal}?
            </h1>
            <p className="text-muted-foreground text-center text-lg mb-12">
              We'll create a study plan to help you prepare in time
            </p>

            <div className="flex justify-center mb-8">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="xl"
                    className={cn(
                      "w-72 justify-start text-left font-normal",
                      !targetDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    {targetDate ? format(targetDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={targetDate}
                    onSelect={setTargetDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                variant="hero"
                size="xl"
                disabled={!targetDate || updateProfile.isPending}
                onClick={handleComplete}
              >
                {updateProfile.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Start Learning
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
