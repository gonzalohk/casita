/**
 * usePhases.ts
 * CRUD hooks for project phases (fases de obra).
 *
 * Phases are the top-level grouping entity for the project.
 * Examples: "Obra Gruesa", "Obra Fina", "Terminaciones".
 *
 * Expenses, income entries, materials, and schedule tasks all have an
 * optional phase_id foreign key so costs can be tracked per phase.
 *
 * usePhases()       — list all phases for the current project, ordered by sort_order
 * useCreatePhase()  — insert a new phase
 * useUpdatePhase()  — update name/color of an existing phase
 * useDeletePhase()  — delete a phase (tasks become unphased, not deleted)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import { ProjectPhase, ProjectPhaseInsert, ProjectPhaseUpdate } from '@/types/database';
import { useProjectStore } from '@/stores/projectStore';

export function usePhases() {
  const { project } = useProjectStore();

  return useQuery({
    queryKey: queryKeys.phases.all,
    queryFn: async () => {
      if (!project) return [];
      const { data, error } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', project.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ProjectPhase[];
    },
    enabled: !!project,
  });
}

export function useCreatePhase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (phase: ProjectPhaseInsert) => {
      const { data, error } = await supabase
        .from('project_phases')
        .insert(phase)
        .select()
        .single();
      if (error) throw error;
      return data as ProjectPhase;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.phases.all });
    },
  });
}

export function useUpdatePhase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: ProjectPhaseUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('project_phases')
        .update(update)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ProjectPhase;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.phases.all });
    },
  });
}

export function useDeletePhase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('project_phases').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.phases.all });
      qc.invalidateQueries({ queryKey: queryKeys.schedule.all });
    },
  });
}
