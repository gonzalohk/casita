import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import { BalanceSummary, MonthlyExpense } from '@/types/database';
import { useProjectStore } from '@/stores/projectStore';

export function useBalance() {
  const { project } = useProjectStore();

  return useQuery({
    queryKey: queryKeys.balance,
    queryFn: async () => {
      if (!project) return null;
      const { data, error } = await supabase
        .from('v_balance_summary')
        .select('*')
        .eq('project_id', project.id)
        .single();

      if (error) throw error;
      return data as BalanceSummary;
    },
    enabled: !!project,
    // Realtime balance — refresh every time any mutation invalidates it
    staleTime: 0,
  });
}

export function useMonthlyExpenses(months: number = 6) {
  const { project } = useProjectStore();

  return useQuery({
    queryKey: queryKeys.monthlyExpenses(months),
    queryFn: async () => {
      if (!project) return [];
      const { data, error } = await supabase
        .from('v_monthly_expenses')
        .select('*')
        .eq('project_id', project.id)
        .order('month', { ascending: false })
        .limit(months * 10); // multiple categories per month

      if (error) throw error;
      return (data ?? []) as MonthlyExpense[];
    },
    enabled: !!project,
  });
}
