import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useSubscription } from './useSubscription';
import { startOfWeek, format } from 'date-fns';

interface UsageTracking {
  id: string;
  user_id: string;
  week_start: string;
  uploads_count: number;
  mock_tests_count: number;
  verified_test_attempts: number;
}

export function useUsageLimits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { limits, isUnlimited } = useSubscription();

  // Get current week start (Monday)
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const { data: usage, isLoading } = useQuery({
    queryKey: ['usage_tracking', user?.id, weekStart],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Try to get existing usage record
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .maybeSingle();
      
      if (error) throw error;
      
      // If no record exists, create one
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('usage_tracking')
          .insert({
            user_id: user.id,
            week_start: weekStart,
            uploads_count: 0,
            mock_tests_count: 0,
            verified_test_attempts: 0,
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newData as UsageTracking;
      }
      
      return data as UsageTracking;
    },
    enabled: !!user?.id,
  });

  // Calculate remaining usage
  const uploadsUsed = usage?.uploads_count ?? 0;
  const uploadsRemaining = isUnlimited('uploadsPerWeek') 
    ? Infinity 
    : Math.max(0, limits.uploadsPerWeek - uploadsUsed);
  
  const mockTestsUsed = usage?.mock_tests_count ?? 0;
  const mockTestsRemaining = isUnlimited('mockTestsPerWeek')
    ? Infinity
    : Math.max(0, limits.mockTestsPerWeek - mockTestsUsed);

  const verifiedTestsUsed = usage?.verified_test_attempts ?? 0;

  // Increment upload count
  const incrementUploadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !usage) throw new Error('Not authenticated or no usage data');
      
      const { error } = await supabase
        .from('usage_tracking')
        .update({ uploads_count: uploadsUsed + 1 })
        .eq('id', usage.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage_tracking', user?.id, weekStart] });
    },
  });

  // Increment mock test count
  const incrementMockTestMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !usage) throw new Error('Not authenticated or no usage data');
      
      const { error } = await supabase
        .from('usage_tracking')
        .update({ mock_tests_count: mockTestsUsed + 1 })
        .eq('id', usage.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage_tracking', user?.id, weekStart] });
    },
  });

  // Increment verified test attempts
  const incrementVerifiedTestMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !usage) throw new Error('Not authenticated or no usage data');
      
      const { error } = await supabase
        .from('usage_tracking')
        .update({ verified_test_attempts: verifiedTestsUsed + 1 })
        .eq('id', usage.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage_tracking', user?.id, weekStart] });
    },
  });

  return {
    usage,
    isLoading,
    uploadsUsed,
    uploadsRemaining,
    canUpload: uploadsRemaining > 0,
    mockTestsUsed,
    mockTestsRemaining,
    canTakeMockTest: mockTestsRemaining > 0,
    verifiedTestsUsed,
    incrementUpload: incrementUploadMutation.mutateAsync,
    incrementMockTest: incrementMockTestMutation.mutateAsync,
    incrementVerifiedTest: incrementVerifiedTestMutation.mutateAsync,
    weekStart,
  };
}
