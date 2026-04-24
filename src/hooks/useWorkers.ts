import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import { Worker, WorkerInsert, WorkerUpdate, PayrollEntry, PayrollEntryInsert } from '@/types/database';
import { useProjectStore } from '@/stores/projectStore';

// ── Workers ──────────────────────────────────────────────────

export function useWorkers() {
  const { project } = useProjectStore();

  return useQuery({
    queryKey: queryKeys.workers.all,
    queryFn: async () => {
      if (!project) return [];
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('project_id', project.id)
        .order('status')
        .order('name');
      if (error) throw error;
      return (data ?? []) as Worker[];
    },
    enabled: !!project,
  });
}

export function useCreateWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (worker: WorkerInsert) => {
      const { data, error } = await supabase.from('workers').insert(worker).select().single();
      if (error) throw error;
      return data as Worker;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workers.all });
    },
  });
}

export function useUpdateWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: WorkerUpdate & { id: string }) => {
      const { data, error } = await supabase.from('workers').update(update).eq('id', id).select().single();
      if (error) throw error;
      return data as Worker;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.workers.all });
      qc.invalidateQueries({ queryKey: queryKeys.workers.detail(vars.id) });
    },
  });
}

// ── Payroll ──────────────────────────────────────────────────

export function usePayrollByWorker(workerId: string) {
  return useQuery({
    queryKey: queryKeys.workers.payroll(workerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_entries')
        .select('*')
        .eq('worker_id', workerId)
        .order('date_paid', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PayrollEntry[];
    },
    enabled: !!workerId,
  });
}

export function usePayroll() {
  const { project } = useProjectStore();

  return useQuery({
    queryKey: queryKeys.payroll,
    queryFn: async () => {
      if (!project) return [];
      const { data, error } = await supabase
        .from('payroll_entries')
        .select('*, workers(id, name, role)')
        .eq('project_id', project.id)
        .order('date_paid', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PayrollEntry[];
    },
    enabled: !!project,
  });
}

export function useCreatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: PayrollEntryInsert) => {
      const { data, error } = await supabase.from('payroll_entries').insert(entry).select().single();
      if (error) throw error;
      return data as PayrollEntry;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.payroll });
      qc.invalidateQueries({ queryKey: queryKeys.workers.payroll(vars.worker_id) });
      qc.invalidateQueries({ queryKey: queryKeys.balance });
    },
  });
}

export function useDeletePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('payroll_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.payroll });
      qc.invalidateQueries({ queryKey: queryKeys.balance });
    },
  });
}
