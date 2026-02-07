import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
 import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth';
import { useFeatureUnlock } from '@/hooks/useFeatureUnlock';
import { Button } from '@/components/ui/button';
import { LockedNavItem } from '@/components/ui/locked-feature';
 import { LanguageSelector } from '@/components/LanguageSelector';
import { 
  BookOpen, 
  LayoutDashboard, 
  Upload, 
  Layers, 
  HelpCircle, 
  Calendar,
  LogOut,
  User,
  Menu,
  X,
  Trophy,
  Gift,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export function DashboardLayout({ children }: { children: ReactNode }) {
   const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { milestones, isLoading } = useFeatureUnlock();

  const isUnlocked = milestones?.first_upload_completed ?? false;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const closeSidebar = () => setSidebarOpen(false);

  // Navigation items - all locked until first upload except Dashboard
  const navItems = [
     { icon: LayoutDashboard, label: t('sidebar.dashboard'), path: '/dashboard', alwaysUnlocked: true },
     { icon: Upload, label: t('sidebar.upload'), path: '/upload', alwaysUnlocked: true },
     { icon: Layers, label: t('sidebar.topics'), path: '/topics' },
     { icon: HelpCircle, label: t('sidebar.practice'), path: '/practice' },
     { icon: Calendar, label: t('sidebar.planner'), path: '/planner' },
     { icon: Trophy, label: t('sidebar.achievements'), path: '/achievements' },
     { icon: Gift, label: t('sidebar.rewards'), path: '/rewards' },
     { icon: Settings, label: t('sidebar.settings'), path: '/settings' },
  ];

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-accent-foreground" />
            </div>
            <span className="font-display text-lg font-bold">Learnorita</span>
          </Link>
           <div className="flex items-center gap-2">
             <LanguageSelector />
             <button
               onClick={() => setSidebarOpen(true)}
               className="p-2 text-muted-foreground hover:text-foreground"
               aria-label="Open menu"
             >
               <Menu className="w-6 h-6" />
             </button>
           </div>
        </header>

        {/* Main content */}
        <main className="flex-1 pb-20">
          {children}
        </main>

        {/* Bottom navigation - simplified to 3 items */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-40 safe-area-pb">
          <div className="flex items-center justify-around py-2">
            <Link
              to="/dashboard"
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[64px]",
                location.pathname === '/dashboard' ? "text-accent" : "text-muted-foreground"
              )}
            >
              <LayoutDashboard className="w-5 h-5" />
               <span className="text-[10px] font-medium">{t('sidebar.dashboard')}</span>
            </Link>
            <Link
              to="/upload"
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[64px]",
                location.pathname === '/upload' ? "text-accent" : "text-accent/80"
              )}
            >
              <Upload className="w-5 h-5" />
               <span className="text-[10px] font-medium">{t('sidebar.upload')}</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[64px] text-muted-foreground"
            >
              <Menu className="w-5 h-5" />
               <span className="text-[10px] font-medium">{t('nav.more')}</span>
            </button>
          </div>
        </nav>

        {/* Full screen sidebar overlay */}
        {sidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
              onClick={closeSidebar}
            />
            <aside className="fixed inset-y-0 right-0 w-72 bg-card border-l border-border z-50 flex flex-col animate-in slide-in-from-right duration-300">
              <div className="p-4 flex items-center justify-between border-b border-border">
                 <span className="font-display text-lg font-bold">{t('nav.menu')}</span>
                <button
                  onClick={closeSidebar}
                  className="p-2 text-muted-foreground hover:text-foreground"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <nav className="flex-1 p-3 overflow-y-auto">
                <ul className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const isItemUnlocked = item.alwaysUnlocked || isUnlocked;
                    
                    if (!isItemUnlocked) {
                      return (
                        <li key={item.path}>
                          <LockedNavItem 
                            icon={item.icon} 
                            label={item.label} 
                             hint={t('sidebar.uploadToUnlock')} 
                          />
                        </li>
                      );
                    }
                    
                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          onClick={closeSidebar}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                            isActive
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          )}
                        >
                          <item.icon className="w-5 h-5" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/50 mb-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-sm truncate">{user?.email}</span>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-muted-foreground"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                   {t('nav.signOut')}
                </Button>
              </div>
            </aside>
          </>
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col">
        {/* Logo */}
        <div className="p-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-display text-xl font-bold">Learnorita</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const isItemUnlocked = item.alwaysUnlocked || isUnlocked;
              
              if (!isItemUnlocked) {
                return (
                  <li key={item.path}>
                    <LockedNavItem 
                      icon={item.icon} 
                      label={item.label} 
                       hint={t('sidebar.uploadToUnlock')} 
                    />
                  </li>
                );
              }
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border">
           <div className="mb-3">
             <LanguageSelector />
           </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/50 mb-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <User className="w-4 h-4 text-accent" />
            </div>
            <span className="text-sm truncate">{user?.email}</span>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
             {t('nav.signOut')}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
