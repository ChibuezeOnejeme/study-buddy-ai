import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
 import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
 import { LanguageSelector } from '@/components/LanguageSelector';

export function Navbar() {
   const { t } = useTranslation();
 
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-accent-foreground" />
          </div>
          <span className="font-display text-xl font-bold">Learnorita</span>
        </Link>
        
         <div className="flex items-center gap-2 sm:gap-4">
           <LanguageSelector />
          <Button variant="ghost" asChild>
             <Link to="/login">{t('nav.signIn')}</Link>
          </Button>
          <Button variant="hero" asChild>
             <Link to="/signup">{t('nav.getStarted')}</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
