 import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/lib/auth';
import { PlanBadge } from '@/components/subscription/PlanBadge';
import { PLAN_NAMES, PLAN_PRICES } from '@/lib/planLimits';
import { Link } from 'react-router-dom';
import { User, CreditCard, Shield, ExternalLink } from 'lucide-react';

const Settings = () => {
   const { t } = useTranslation();
  const { user } = useAuth();
  const { plan, effectivePlan, isDevMode, subscription } = useSubscription();

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-3xl mx-auto">
        <div className="mb-8">
           <h1 className="font-display text-3xl font-bold mb-2">{t('settings.title')}</h1>
          <p className="text-muted-foreground">
             {t('settings.description')}
          </p>
        </div>

        <div className="space-y-6">
          {/* Account Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                 {t('settings.profile')}
              </CardTitle>
               <CardDescription>{t('settings.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                 <p className="text-sm text-muted-foreground">{t('settings.email')}</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account ID</p>
                <p className="font-mono text-sm">{user?.id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                 {t('settings.subscription')}
              </CardTitle>
               <CardDescription>{t('settings.currentPlan')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                   <p className="text-sm text-muted-foreground">{t('settings.currentPlan')}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <PlanBadge plan={effectivePlan} isDevMode={isDevMode} />
                    <span className="font-medium">
                      {PLAN_NAMES[effectivePlan]}
                      {PLAN_PRICES[effectivePlan] > 0 && (
                        <span className="text-muted-foreground font-normal ml-1">
                          (${PLAN_PRICES[effectivePlan]}/month)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <Button variant="outline" asChild>
                  <Link to="/pricing">
                     {plan === 'free' ? t('settings.upgrade') : t('settings.upgrade')}
                  </Link>
                </Button>
              </div>

              {subscription && (
                <>
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{subscription.status}</p>
                  </div>
                  
                  {subscription.current_period_end && (
                    <div>
                      <p className="text-sm text-muted-foreground">Current Period Ends</p>
                      <p className="font-medium">
                        {new Date(subscription.current_period_end).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </>
              )}

              {isDevMode && (
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 text-accent font-medium mb-1">
                    <Shield className="w-4 h-4" />
                    Dev Mode Active
                  </div>
                  <p className="text-sm text-muted-foreground">
                    All Pro features are unlocked for testing. This will be disabled 
                    when Stripe is connected and real billing is enabled.
                  </p>
                </div>
              )}

              {!isDevMode && PLAN_PRICES[plan] > 0 && (
                <div className="border-t pt-4">
                  <Button variant="outline" className="w-full" disabled>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Manage Billing (Coming Soon)
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Stripe billing portal integration coming soon
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Data & Privacy
              </CardTitle>
              <CardDescription>Manage your data</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Your data is stored securely and never shared with third parties.
              </p>
              <Button variant="outline" disabled>
                Export My Data (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
