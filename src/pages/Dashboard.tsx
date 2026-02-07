import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { useFeatureUnlock } from '@/hooks/useFeatureUnlock';
import { NewUserDashboard } from '@/components/dashboard/NewUserDashboard';
import { ReturningUserDashboard } from '@/components/dashboard/ReturningUserDashboard';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { milestones, isLoading: milestonesLoading } = useFeatureUnlock();

  const isLoading = profileLoading || milestonesLoading;
  const hasCompletedFirstUpload = milestones?.first_upload_completed ?? false;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {hasCompletedFirstUpload ? (
        <ReturningUserDashboard />
      ) : (
        <NewUserDashboard />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
