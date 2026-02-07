import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LockedFeatureProps {
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}

export function LockedFeature({ title, description, className, children }: LockedFeatureProps) {
  return (
    <div className={cn(
      "relative bg-card rounded-xl border border-border p-6 overflow-hidden min-h-[100px]",
      className
    )}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4">
        <Lock className="w-6 h-6 text-muted-foreground/50 mb-2" />
        <h3 className="font-semibold text-center text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground text-center">{description}</p>
      </div>
      {/* Blurred preview content */}
      <div className="opacity-30 pointer-events-none blur-sm">
        {children || <div className="h-12 bg-muted rounded-lg" />}
      </div>
    </div>
  );
}

interface LockedPageProps {
  title: string;
  description: string;
  previewContent?: ReactNode;
}

export function LockedPage({ title, description, previewContent }: LockedPageProps) {
  return (
    <div className="relative min-h-[60vh]">
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md z-20 flex flex-col items-center justify-center p-8">
        <Lock className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-center">{title}</h2>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          {description}
        </p>
        <Button variant="hero" asChild>
          <Link to="/dashboard">Upload Content to Unlock</Link>
        </Button>
      </div>
      {/* Preview content behind blur */}
      <div className="opacity-30 pointer-events-none">
        {previewContent || (
          <div className="p-8 space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-32 bg-muted rounded-xl" />
              <div className="h-32 bg-muted rounded-xl" />
              <div className="h-32 bg-muted rounded-xl" />
            </div>
            <div className="h-48 bg-muted rounded-xl" />
          </div>
        )}
      </div>
    </div>
  );
}

interface LockedNavItemProps {
  icon: React.ElementType;
  label: string;
  hint?: string;
}

export function LockedNavItem({ icon: Icon, label, hint }: LockedNavItemProps) {
  return (
    <div 
      className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground/50 cursor-not-allowed"
      title={hint}
    >
      <div className="relative">
        <Icon className="w-5 h-5" />
        <Lock className="w-3 h-3 absolute -top-1 -right-1 text-muted-foreground/70" />
      </div>
      <span>{label}</span>
    </div>
  );
}
