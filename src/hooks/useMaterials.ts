import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import { Material, MaterialInsert, MaterialUpdate, StockMovement } from '@/types/database';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';

export function useMaterials() {
  const { project } = useProjectStore();

  return useQuery({
    queryKey: queryKeys.materials.all,
    queryFn: async () => {
      if (!project) return [];
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('project_id', project.id)
        .order('name');
      if (error) throw error;
      return (data ?? []) as Material[];
    },
    enabled: !!project,
  });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (material: MaterialInsert) => {
      const { data, error } = await supabase.from('materials').insert(material).select().single();
      if (error) throw error;
      return data as Material;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.materials.all });
    },
  });
}

export function useUpdateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: MaterialUpdate & { id: string }) => {
      const { data, error } = await supabase.from('materials').update(update).eq('id', id).select().single();
      if (error) throw error;
      return data as Material;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.materials.all });
    },
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  const { project } = useProjectStore();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({ id, delta, note }: { id: string; delta: number; note?: string }) => {
      // 1. Fetch current stock
      const { data: current, error: fetchError } = await supabase
        .from('materials')
        .select('stock_current')
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;

      const newStock = Math.max(0, current.stock_current + delta);

      // 2. Update stock
      const { data: updated, error: updateError } = await supabase
        .from('materials')
        .update({ stock_current: newStock })
        .eq('id', id)
        .select()
        .single();
      if (updateError) throw updateError;

      // 3. Log movement
      if (project && user) {
        await supabase.from('stock_movements').insert({
          material_id: id,
          project_id: project.id,
          user_id: user.id,
          delta,
          stock_after: newStock,
          note: note?.trim() || null,
        });
      }

      return updated as Material;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.materials.all });
      qc.invalidateQueries({ queryKey: queryKeys.materials.movements(id) });
    },
  });
}

export function useStockMovements(materialId: string) {
  return useQuery({
    queryKey: queryKeys.materials.movements(materialId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('material_id', materialId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as StockMovement[];
    },
    enabled: !!materialId,
  });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('materials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.materials.all });
    },
  });
}
