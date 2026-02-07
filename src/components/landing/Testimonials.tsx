  import { Star, Quote } from 'lucide-react';
  import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
  import { useTranslation } from 'react-i18next';
 
 const testimonials = [
   {
     name: 'Sarah Chen',
     role: 'AWS Solutions Architect',
     avatar: 'SC',
     rating: 5,
     quote: 'Passed my AWS certification on the first try! The AI-generated flashcards covered exactly what was on the exam. Saved me weeks of study time.',
     certification: 'AWS SAA-C03',
   },
   {
     name: 'Marcus Johnson',
     role: 'Project Manager',
     avatar: 'MJ',
     rating: 5,
     quote: 'The practice questions were incredibly accurate. Learnorita helped me identify my weak areas and focus my study sessions effectively.',
     certification: 'PMP',
   },
   {
     name: 'Emily Rodriguez',
     role: 'Financial Analyst',
     avatar: 'ER',
     rating: 5,
     quote: 'As a working professional, I needed efficient study tools. The smart study planner fit perfectly into my busy schedule. Passed CFA Level 1!',
     certification: 'CFA Level 1',
   },
   {
     name: 'David Kim',
     role: 'Security Engineer',
     avatar: 'DK',
     rating: 5,
     quote: 'The camera feature is amazing! I just snapped photos of my textbook pages and got instant flashcards. Game changer for visual learners.',
     certification: 'CISSP',
   },
   {
     name: 'Priya Patel',
     role: 'Accountant',
     avatar: 'PP',
     rating: 5,
     quote: 'I was struggling with CPA exam prep until I found Learnorita. The topic organization helped me tackle each section systematically.',
     certification: 'CPA',
   },
   {
     name: 'James Wilson',
     role: 'Cloud Architect',
     avatar: 'JW',
     rating: 5,
     quote: 'Used Learnorita for both my Azure and GCP certifications. The streak feature kept me motivated throughout my study journey.',
     certification: 'Multi-Cloud Certified',
   },
 ];
 
 export function Testimonials() {
    const { t } = useTranslation();
 
   return (
     <section className="py-24 bg-secondary/30">
       <div className="container px-4">
         <div className="text-center mb-16">
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 text-warning mb-6">
             <Star className="w-4 h-4 fill-current" />
             <span className="text-sm font-medium">Trusted by Professionals</span>
           </div>
           <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              {t('testimonials.title1')} <span className="text-gradient-accent">{t('testimonials.title2')}</span>
           </h2>
           <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('testimonials.description')}
           </p>
         </div>
         
         {/* Testimonials grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
           {testimonials.map((testimonial, index) => (
             <div
               key={testimonial.name}
               className="group p-6 rounded-2xl bg-card border border-border hover:border-accent/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
               style={{ animationDelay: `${index * 0.1}s` }}
             >
               {/* Quote icon */}
               <Quote className="w-8 h-8 text-accent/30 mb-4" />
               
               {/* Rating */}
               <div className="flex gap-1 mb-4">
                 {Array.from({ length: testimonial.rating }).map((_, i) => (
                   <Star key={i} className="w-4 h-4 text-warning fill-warning" />
                 ))}
               </div>
               
               {/* Quote */}
               <p className="text-muted-foreground mb-6 leading-relaxed">
                 "{testimonial.quote}"
               </p>
               
               {/* Author */}
               <div className="flex items-center gap-3">
                 <Avatar className="w-12 h-12 border-2 border-accent/20">
                   <AvatarImage src="" />
                   <AvatarFallback className="bg-gradient-accent text-accent-foreground font-semibold">
                     {testimonial.avatar}
                   </AvatarFallback>
                 </Avatar>
                 <div>
                   <p className="font-semibold">{testimonial.name}</p>
                   <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                 </div>
               </div>
               
               {/* Certification badge */}
               <div className="mt-4 pt-4 border-t border-border">
                 <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                   ✓ Passed {testimonial.certification}
                 </span>
               </div>
             </div>
           ))}
         </div>
       </div>
     </section>
   );
 }