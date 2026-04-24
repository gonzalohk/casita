import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import { IncomeEntry, IncomeEntryInsert } from '@/types/database';
import { useProjectStore } from '@/stores/projectStore';

export function useIncome() {
  const { project } = useProjectStore();

  return useQuery({
    queryKey: queryKeys.income,
    queryFn: async () => {
      if (!project) return [];
      const { data, error } = await supabase
        .from('income_entries')
        .select('*')
        .eq('project_id', project.id)
        .order('date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as IncomeEntry[];
    },
    enabled: !!project,
  });
}

export function useCreateIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: IncomeEntryInsert) => {
      const { data, error } = await supabase.from('income_entries').insert(entry).select().single();
      if (error) throw error;
      return data as IncomeEntry;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.income });
      qc.invalidateQueries({ queryKey: queryKeys.balance });
    },
  });
}

export function useDeleteIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('income_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.income });
      qc.invalidateQueries({ queryKey: queryKeys.balance });
    },
  });
}
