import { toast } from 'sonner';
import * as LucideIcons from 'lucide-react';

interface Badge {
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
}

export function showAchievementToast(badge: Badge) {
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[badge.icon] || LucideIcons.Award;
  
  toast.custom(
    (t) => (
      <div className="bg-card border border-accent/50 rounded-xl p-4 shadow-lg flex items-center gap-3 min-w-[300px]">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-accent text-accent-foreground">
          <IconComponent className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Badge Unlocked! 🏆</p>
          <p className="text-accent font-medium">{badge.name}</p>
          <p className="text-xs text-muted-foreground">{badge.description}</p>
          <p className="text-xs text-accent mt-1">+{badge.xp_reward} XP</p>
        </div>
      </div>
    ),
    {
      duration: 5000,
      position: 'top-center',
    }
  );
}

interface XPGainProps {
  amount: number;
  eventType?: string;
}

export function showXPGainToast({ amount, eventType }: XPGainProps) {
  const messages: Record<string, string> = {
    flashcard_review: 'Flashcard reviewed',
    flashcard_master: 'Flashcard mastered!',
    question_correct: 'Correct answer',
    practice_session: 'Practice complete',
    mock_test_complete: 'Test complete',
    score_80_plus_bonus: 'High score bonus!',
    score_100_bonus: 'Perfect score!',
    daily_login: 'Daily login bonus',
    streak_7_day_bonus: '7-day streak!',
    streak_30_day_bonus: '30-day streak!',
  };

  const message = eventType ? messages[eventType] || 'XP earned' : 'XP earned';

  toast(
    <div className="flex items-center gap-2">
      <span className="text-accent font-bold">+{amount} XP</span>
      <span className="text-muted-foreground">•</span>
      <span>{message}</span>
    </div>,
    {
      duration: 2000,
      position: 'bottom-center',
    }
  );
}
