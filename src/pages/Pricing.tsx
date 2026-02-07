import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Sparkles, Crown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { PLAN_LIMITS, PLAN_NAMES, PLAN_PRICES, PlanType } from '@/lib/planLimits';
import { cn } from '@/lib/utils';

const plans: PlanType[] = ['free', 'pro'];

const planIcons = {
  free: Sparkles,
  pro: Crown,
};

// Features to show for each plan
const freeFeatures = [
  '5 uploads per week',
  '5 active topics',
  '1 set regeneration per week',
  'AI-generated flashcards',
  'Practice questions',
];

const proFeatures = [
  'Unlimited uploads',
  'Unlimited topics',
  'Unlimited regenerations',
  'Timed exams',
  'Streak protection',
  'XP boosts for high scores',
  'Real-world rewards',
  'Custom mock tests',
];

const Pricing = () => {
  const { effectivePlan, isDevMode } = useSubscription();

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="font-display text-3xl lg:text-4xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Start free, upgrade when you need more power.
          </p>
          {isDevMode && (
            <p className="text-sm text-accent mt-2">
              Dev Mode Active - All Pro features unlocked for testing
            </p>
          )}
        </div>

        {/* Two-column plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Plan */}
          <Card className={cn(
            "relative overflow-hidden transition-all border-border",
            effectivePlan === 'free' && "bg-accent/5 ring-2 ring-accent/20"
          )}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3 bg-secondary text-secondary-foreground">
                <Sparkles className="w-7 h-7" />
              </div>
              <CardTitle className="text-xl">{PLAN_NAMES.free}</CardTitle>
              <div className="mt-2">
                <span className="text-4xl font-bold">$0</span>
              </div>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3 mb-6">
                {freeFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={effectivePlan === 'free' ? "outline" : "default"}
                className="w-full"
                disabled={effectivePlan === 'free' || isDevMode}
              >
                {effectivePlan === 'free' ? 'Current Plan' : 'Get Started'}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className={cn(
            "relative overflow-hidden transition-all border-accent ring-2 ring-accent/20",
            effectivePlan === 'pro' && "bg-accent/5"
          )}>
            <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
              RECOMMENDED
            </div>

            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3 bg-gradient-accent text-accent-foreground">
                <Crown className="w-7 h-7" />
              </div>
              <CardTitle className="text-xl">{PLAN_NAMES.pro}</CardTitle>
              <div className="mt-2">
                <span className="text-4xl font-bold">${PLAN_PRICES.pro}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3 mb-6">
                {proFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={effectivePlan === 'pro' ? "outline" : "hero"}
                className="w-full"
                disabled={effectivePlan === 'pro' || isDevMode}
              >
                {effectivePlan === 'pro' ? 'Current Plan' : 'Coming Soon'}
              </Button>
              
              {effectivePlan !== 'pro' && !isDevMode && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Stripe integration coming soon
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Pricing;
