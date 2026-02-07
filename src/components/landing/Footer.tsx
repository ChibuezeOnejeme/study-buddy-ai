import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
 import { useTranslation } from 'react-i18next';

export function Footer() {
   const { t } = useTranslation();
 
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-display text-xl font-bold">Learnorita</span>
          </div>
          
          <nav className="flex items-center gap-6">
            <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">
               {t('nav.signIn')}
            </Link>
            <Link to="/signup" className="text-muted-foreground hover:text-foreground transition-colors">
               {t('nav.getStarted')}
            </Link>
          </nav>
          
          <p className="text-sm text-muted-foreground">
             © {new Date().getFullYear()} Learnorita. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
