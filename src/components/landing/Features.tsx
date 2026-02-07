import { Camera, FileText, Layers, Target, TrendingUp, Zap } from 'lucide-react';
 import { useTranslation } from 'react-i18next';

 const featureKeys = [
   { icon: Camera, key: 'snapUpload' },
   { icon: Zap, key: 'flashcards' },
   { icon: Target, key: 'questions' },
   { icon: Layers, key: 'topics' },
   { icon: TrendingUp, key: 'progress' },
   { icon: FileText, key: 'plans' },
 ];

export function Features() {
   const { t } = useTranslation();
 
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
             {t('features.title1')} <span className="text-gradient-accent">{t('features.title2')}</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
             {t('features.description')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
           {featureKeys.map((feature, index) => (
            <div
               key={feature.key}
              className="group p-8 rounded-2xl bg-card border border-border hover:border-accent/50 transition-all duration-300 hover:shadow-xl"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-accent flex items-center justify-center text-accent-foreground mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7" />
              </div>
               <h3 className="font-display text-xl font-semibold mb-3">{t(`features.items.${feature.key}.title`)}</h3>
               <p className="text-muted-foreground leading-relaxed">{t(`features.items.${feature.key}.description`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
