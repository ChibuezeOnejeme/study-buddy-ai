import { Upload, Wand2, BookMarked, Trophy } from 'lucide-react';
 import { useTranslation } from 'react-i18next';

 const stepKeys = [
   { step: '01', icon: Upload, key: 'upload' },
   { step: '02', icon: Wand2, key: 'process' },
   { step: '03', icon: BookMarked, key: 'study' },
   { step: '04', icon: Trophy, key: 'ace' },
 ];

export function HowItWorks() {
   const { t } = useTranslation();
 
  return (
    <section className="py-24">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
             {t('howItWorks.title1')} <span className="text-gradient-accent">{t('howItWorks.title2')}</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
             {t('howItWorks.description')}
          </p>
        </div>
        
        <div className="relative max-w-5xl mx-auto">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-accent/0 via-accent/50 to-accent/0 -translate-y-1/2" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
             {stepKeys.map((step) => (
               <div key={step.key} className="relative group">
                <div className="text-center">
                  {/* Step number */}
                  <div className="relative z-10 w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-lg group-hover:shadow-glow transition-shadow duration-300">
                    <step.icon className="w-10 h-10 text-accent-foreground" />
                  </div>
                  
                  {/* Step indicator */}
                  <div className="font-display text-4xl font-bold text-accent/20 mb-2">{step.step}</div>
                  
                   <h3 className="font-display text-lg font-semibold mb-2">{t(`howItWorks.steps.${step.key}.title`)}</h3>
                   <p className="text-muted-foreground text-sm">{t(`howItWorks.steps.${step.key}.description`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
