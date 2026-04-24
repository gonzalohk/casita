import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import { Expense, ExpenseInsert, ExpenseUpdate, ExpenseCategory, ExpenseCategoryInsert } from '@/types/database';
import { useProjectStore } from '@/stores/projectStore';

// ── Expenses ────────────────────────────────────────────────

interface ExpenseFilters {
  category_id?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useExpenses(filters?: ExpenseFilters) {
  const { project } = useProjectStore();

  return useQuery({
    queryKey: queryKeys.expenses.list(filters),
    queryFn: async () => {
      if (!project) return [];
      let query = supabase
        .from('expenses')
        .select('*, expense_categories(id, name, color, icon, type)')
        .eq('project_id', project.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.category_id) query = query.eq('category_id', filters.category_id);
      if (filters?.dateFrom) query = query.gte('date', filters.dateFrom);
      if (filters?.dateTo) query = query.lte('date', filters.dateTo);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Expense[];
    },
    enabled: !!project,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (expense: ExpenseInsert) => {
      const { data, error } = await supabase.from('expenses').insert(expense).select().single();
      if (error) throw error;
      return data as Expense;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses.all });
      qc.invalidateQueries({ queryKey: queryKeys.balance });
    },
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: ExpenseUpdate & { id: string }) => {
      const { data, error } = await supabase.from('expenses').update(update).eq('id', id).select().single();
      if (error) throw error;
      return data as Expense;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses.all });
      qc.invalidateQueries({ queryKey: queryKeys.balance });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses.all });
      qc.invalidateQueries({ queryKey: queryKeys.balance });
    },
  });
}

// ── Categories ───────────────────────────────────────────────

export function useExpenseCategories() {
  const { project } = useProjectStore();

  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      if (!project) return [];
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('project_id', project.id)
        .order('name');
      if (error) throw error;
      return (data ?? []) as ExpenseCategory[];
    },
    enabled: !!project,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (category: ExpenseCategoryInsert) => {
      const { data, error } = await supabase.from('expense_categories').insert(category).select().single();
      if (error) throw error;
      return data as ExpenseCategory;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}
