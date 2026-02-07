  import { Award, Shield, TrendingUp, BookOpen, Briefcase } from 'lucide-react';
  import { useTranslation } from 'react-i18next';
 
 const certifications = [
   {
     name: 'AWS',
     fullName: 'Amazon Web Services',
     icon: Shield,
     color: 'from-orange-500 to-yellow-500',
     bgColor: 'bg-orange-500/10',
   },
   {
     name: 'PMP',
     fullName: 'Project Management Professional',
     icon: Briefcase,
     color: 'from-blue-600 to-blue-400',
     bgColor: 'bg-blue-500/10',
   },
   {
     name: 'CPA',
     fullName: 'Certified Public Accountant',
     icon: TrendingUp,
     color: 'from-emerald-500 to-teal-500',
     bgColor: 'bg-emerald-500/10',
   },
   {
     name: 'CISSP',
     fullName: 'Cybersecurity Professional',
     icon: Shield,
     color: 'from-purple-600 to-pink-500',
     bgColor: 'bg-purple-500/10',
   },
   {
     name: 'CFA',
     fullName: 'Chartered Financial Analyst',
     icon: Award,
     color: 'from-amber-500 to-orange-500',
     bgColor: 'bg-amber-500/10',
   },
 ];
 
 export function Certifications() {
    const { t } = useTranslation();
 
   return (
     <section className="py-24 bg-background relative overflow-hidden">
       {/* Background decorations */}
       <div className="absolute top-0 left-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
       <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-info/5 rounded-full blur-3xl" />
       
       <div className="container px-4 relative z-10">
         <div className="text-center mb-16">
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success mb-6">
             <Award className="w-4 h-4" />
             <span className="text-sm font-medium">Professional Certifications</span>
           </div>
           <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              {t('certifications.title1')} <span className="text-gradient-accent">{t('certifications.title2')}</span>
           </h2>
           <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('certifications.description')}
           </p>
         </div>
         
         {/* Creative certification display */}
         <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
           {certifications.map((cert, index) => (
             <div
               key={cert.name}
               className="group relative"
               style={{ animationDelay: `${index * 0.1}s` }}
             >
               <div className={`relative p-8 rounded-3xl ${cert.bgColor} border border-border hover:border-accent/50 transition-all duration-500 hover:scale-105 hover:shadow-xl`}>
                 {/* Gradient glow on hover */}
                 <div className={`absolute inset-0 bg-gradient-to-br ${cert.color} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500`} />
                 
                 {/* Icon badge */}
                 <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cert.color} flex items-center justify-center mb-4 mx-auto shadow-lg group-hover:shadow-glow transition-shadow duration-300`}>
                   <cert.icon className="w-8 h-8 text-white" />
                 </div>
                 
                 {/* Certification name */}
                 <h3 className="font-display text-2xl font-bold text-center mb-1">{cert.name}</h3>
                 <p className="text-sm text-muted-foreground text-center max-w-[140px]">{cert.fullName}</p>
               </div>
             </div>
           ))}
         </div>
         
         {/* Stats bar */}
         <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
           <StatItem value="95%" label="Pass Rate" />
           <StatItem value="50K+" label="Certified Users" />
           <StatItem value="200+" label="Certifications" />
           <StatItem value="4.9/5" label="User Rating" />
         </div>
       </div>
     </section>
   );
 }
 
 function StatItem({ value, label }: { value: string; label: string }) {
   return (
     <div className="text-center">
       <p className="font-display text-3xl md:text-4xl font-bold text-gradient-accent">{value}</p>
       <p className="text-muted-foreground mt-1">{label}</p>
     </div>
   );
 }