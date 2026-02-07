import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show iOS prompt after a delay if not installed
    if (ios && !standalone) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  // Don't show if already installed or dismissed this session
  if (isStandalone || sessionStorage.getItem('installPromptDismissed')) {
    return null;
  }

  if (!showPrompt) return null;

  return (
    <div className={cn(
      "fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-4 sm:w-80",
      "bg-card border border-border rounded-2xl p-4 shadow-xl",
      "animate-in slide-in-from-bottom-4 duration-300 z-50"
    )}>
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center flex-shrink-0">
          <Download className="w-6 h-6 text-accent-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">Install Learnorita</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isIOS 
              ? "Tap Share, then 'Add to Home Screen'" 
              : "Add to home screen for the best experience"
            }
          </p>
        </div>
      </div>
      
      {isIOS ? (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-2">
          <Share2 className="w-4 h-4 flex-shrink-0" />
          <span>Tap the share button below, then "Add to Home Screen"</span>
        </div>
      ) : (
        <Button 
          onClick={handleInstall}
          variant="hero"
          size="sm"
          className="w-full mt-3"
        >
          <Download className="w-4 h-4" />
          Install App
        </Button>
      )}
    </div>
  );
}
