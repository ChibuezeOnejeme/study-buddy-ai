 import { Button } from '@/components/ui/button';
 import { ArrowRight, BookOpen, Brain, Sparkles } from 'lucide-react';
 import { Link } from 'react-router-dom';
 import { useTranslation } from 'react-i18next';

export function Hero() {
   const { t } = useTranslation();
 
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-hero opacity-5" />
      
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-info/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4" />
             <span className="text-sm font-medium">{t('hero.badge')}</span>
          </div>
          
          {/* Heading */}
          <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground mb-6 animate-slide-up">
             {t('hero.title1')}
             <span className="block text-gradient-accent">{t('hero.title2')}</span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
             {t('hero.description')}
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Button variant="hero" size="xl" asChild>
              <Link to="/signup">
                 {t('hero.cta')}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="heroOutline" size="xl" asChild>
              <Link to="/login">
                 {t('nav.signIn')}
              </Link>
            </Button>
          </div>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <FeatureCard
              icon={<BookOpen className="w-6 h-6" />}
               title={t('features.items.flashcards.title')}
               description={t('hero.stats.flashcards')}
            />
            <FeatureCard
              icon={<Brain className="w-6 h-6" />}
               title={t('features.items.questions.title')}
               description={t('hero.stats.users')}
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
               title={t('features.items.plans.title')}
               description={t('hero.stats.success')}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4 mx-auto">
        {icon}
      </div>
      <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
