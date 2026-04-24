/**
 * useBalance.ts
 * Hooks for fetching the project's financial summary and monthly expense breakdown.
 *
 * useBalance()         — reads the `v_balance_summary` Supabase view which aggregates
 *                        total income, expenses, payroll and calculates the balance.
 *                        staleTime: 0 so it always re-fetches after any mutation.
 *
 * useMonthlyExpenses() — reads the `v_monthly_expenses` view for chart data.
 *                        Returns the last N months of expenses broken down by category.
 */
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
