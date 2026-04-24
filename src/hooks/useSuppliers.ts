import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import { Supplier, SupplierInsert, SupplierUpdate } from '@/types/database';
import { useProjectStore } from '@/stores/projectStore';

export function useSuppliers() {
  const { project } = useProjectStore();

  return useQuery({
    queryKey: queryKeys.suppliers.all,
    queryFn: async () => {
      if (!project) return [];
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('project_id', project.id)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Supplier[];
    },
    enabled: !!project,
  });
}

export function useSupplier(id: string) {
  const { project } = useProjectStore();

  return useQuery({
    queryKey: queryKeys.suppliers.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Supplier | null;
    },
    enabled: !!project && !!id,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (supplier: SupplierInsert) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplier)
        .select()
        .single();
      if (error) throw error;
      return data as Supplier;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.suppliers.all });
    },
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: SupplierUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(update)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Supplier;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.suppliers.all });
      qc.invalidateQueries({ queryKey: queryKeys.suppliers.detail(data.id) });
    },
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.suppliers.all });
    },
  });
}
