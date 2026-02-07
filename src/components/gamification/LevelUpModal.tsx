import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
  xpTotal: number;
}

export function LevelUpModal({ isOpen, onClose, newLevel, xpTotal }: LevelUpModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        {showConfetti && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "absolute w-2 h-2 rounded-full animate-bounce",
                  i % 3 === 0 ? "bg-accent" : i % 3 === 1 ? "bg-yellow-400" : "bg-purple-400"
                )}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
        )}
        
        <DialogHeader className="space-y-4">
          <div className="mx-auto relative">
            <div className="w-24 h-24 rounded-full bg-gradient-accent flex items-center justify-center text-4xl font-bold text-accent-foreground animate-pulse">
              {newLevel}
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-spin" />
            <Star className="absolute -bottom-1 -left-1 w-6 h-6 text-yellow-400" />
            <Zap className="absolute top-0 -left-3 w-5 h-5 text-accent" />
          </div>
          
          <DialogTitle className="text-2xl">
            Level Up! 🎉
          </DialogTitle>
          
          <DialogDescription className="text-base">
            Congratulations! You've reached{' '}
            <span className="font-bold text-accent">Level {newLevel}</span>
            <br />
            <span className="text-muted-foreground">
              Total XP: {xpTotal.toLocaleString()}
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6">
          <Button variant="hero" onClick={onClose} className="w-full">
            Continue Learning
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
