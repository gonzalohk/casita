/**
 * useProject.ts
 * Hook for loading and updating the user's single project.
 *
 * On mount it queries the `projects` table for the row matching the
 * logged-in user. The result is synced into the Zustand projectStore
 * via a useEffect so all other hooks can read `project` synchronously.
 *
 * If no project is found (new user) the AppLayout redirects to /onboarding.
 *
 * useProject()       — fetch + sync project to store
 * useUpdateProject() — PATCH project fields (name, budget, status etc.)
 */
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { queryKeys } from '@/lib/queryClient';
import { Project, ProjectInsert, ProjectUpdate } from '@/types/database';

/**
 * Fetches the authenticated user's single project.
 * Redirects to onboarding if none found (handled in AppLayout).
 */
export function useProject() {
  const { user } = useAuthStore();
  const { setProject } = useProjectStore();

  const query = useQuery({
    queryKey: queryKeys.project,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return (data as Project) ?? null;
    },
    enabled: !!user,
  });

  // Sync fetched project to the Zustand store outside of queryFn
  useEffect(() => {
    if (query.data !== undefined) {
      setProject(query.data);
    }
  }, [query.data, setProject]);

  return query;
}

export function useProjects() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as Project[]) ?? [];
    },
    enabled: !!user,
    refetchOnMount: 'always',
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (update: ProjectUpdate & { id: string }) => {
      const { id, ...rest } = update;
      const { data, error } = await supabase
        .from('projects')
        .update(rest)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.project });
    },
  });
}
