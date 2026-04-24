import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import { ScheduleTask, ScheduleTaskInsert, ScheduleTaskUpdate } from '@/types/database';
import { useProjectStore } from '@/stores/projectStore';

export function useScheduleTasks() {
  const { project } = useProjectStore();

  return useQuery({
    queryKey: queryKeys.schedule.all,
    queryFn: async () => {
      if (!project) return [];
      const { data, error } = await supabase
        .from('schedule_tasks')
        .select('*, project_phases(id, name, color, sort_order)')
        .eq('project_id', project.id)
        .order('start_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ScheduleTask[];
    },
    enabled: !!project,
  });
}

export function useScheduleTask(id: string) {
  const { project } = useProjectStore();

  return useQuery({
    queryKey: queryKeys.schedule.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_tasks')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as ScheduleTask | null;
    },
    enabled: !!project && !!id,
  });
}

export function useCreateScheduleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: ScheduleTaskInsert) => {
      const { data, error } = await supabase
        .from('schedule_tasks')
        .insert(task)
        .select()
        .single();
      if (error) throw error;
      return data as ScheduleTask;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.schedule.all });
    },
  });
}

export function useUpdateScheduleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: ScheduleTaskUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('schedule_tasks')
        .update(update)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ScheduleTask;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.schedule.all });
      qc.invalidateQueries({ queryKey: queryKeys.schedule.detail(data.id) });
    },
  });
}

export function useDeleteScheduleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('schedule_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.schedule.all });
    },
  });
}
